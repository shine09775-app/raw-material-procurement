import { clean, parseNumber, dateOverlaps, contractModelOf, priceBasisField, priceBasisLabel, materialTypeOf, getGapClass } from './formatters'
import { haversineKm } from './haversine'

function sourcePriority(row) {
  const cat = clean(row.source_category)
  if (cat === 'หลัก') return 0
  if (cat === 'สำรอง') return 1
  return 2
}

export function buildRepresentativeRows(contractRows, locationMap, filters) {
  const {
    focusPlantCode, radiusKm, compareField,
    matStone, matSand, materialCodes,
    dateFrom, dateTo, contractModel,
    gapOnly, gapThreshold,
  } = filters

  const allowedTypes = new Set()
  if (matStone) allowedTypes.add('rock')
  if (matSand) allowedTypes.add('sand')

  // filter rows
  const filtered = contractRows.filter((row) => {
    const loc = locationMap.get(clean(row.plant_code))
    if (!loc) return false
    if (!dateOverlaps(row, dateFrom, dateTo)) return false
    if (contractModel !== 'all' && contractModelOf(row) !== contractModel) return false
    const mType = materialTypeOf(clean(row.material_name), clean(row.material_code))
    if (allowedTypes.size && !allowedTypes.has(mType)) return false
    if (materialCodes.length && !materialCodes.includes(clean(row.material_code))) return false
    return true
  })

  // build representative row per plant × material (prefer หลัก, else lowest total)
  const groupMap = new Map()
  filtered.forEach((row) => {
    const key = `${clean(row.plant_code)}||${clean(row.material_code)}`
    const existing = groupMap.get(key)
    const rowPriority = sourcePriority(row)
    const rowTotal = parseNumber(row.total_price || row.total_transportation_price)
    if (!existing) { groupMap.set(key, { row, priority: rowPriority, total: rowTotal }); return }
    if (rowPriority < existing.priority) { groupMap.set(key, { row, priority: rowPriority, total: rowTotal }); return }
    if (rowPriority === existing.priority && rowTotal < existing.total) {
      groupMap.set(key, { row, priority: rowPriority, total: rowTotal })
    }
  })

  return [...groupMap.values()].map(({ row }) => {
    const loc = locationMap.get(clean(row.plant_code))
    const sourceCost = parseNumber(row.rawmat_price)
    const transportCost = parseNumber(row.transport_price_after_adjust || row.total_transportation_price)
    const totalCost = parseNumber(row.total_price || row.total_transportation_price)
    const otherCost = Math.max(0, totalCost - sourceCost - transportCost)
    return {
      key: `${clean(row.plant_code)}||${clean(row.material_code)}`,
      plant_code: clean(row.plant_code),
      plant_name: clean(row.plant_name),
      material_code: clean(row.material_code),
      material_name: clean(row.material_name),
      contract_label: clean(row.contract_type),
      source_category: clean(row.source_category),
      source_name: clean(row.source_name || row.source_plant_name),
      transporter_name: clean(row.transporter_name),
      effective_date: clean(row.effective_date),
      end_date: clean(row.end_date),
      distance_km: parseNumber(row.distance_km),
      source_cost: sourceCost,
      transport_cost: transportCost,
      total_cost: totalCost,
      other_cost: otherCost,
      latitude: loc?.lat,
      longitude: loc?.lng,
    }
  })
}

export function computeBenchmarkRows(contractRows, locationMap, filters) {
  const compareField = priceBasisField(filters.priceBasis)
  const compareLabel = priceBasisLabel(filters.priceBasis)
  const filtersWithField = { ...filters, compareField, compareLabel }

  const candidates = buildRepresentativeRows(contractRows, locationMap, filtersWithField)
    .map((row) => ({ ...row, compare_value: row[compareField] ?? row.total_cost }))

  const focusLoc = locationMap.get(filters.focusPlantCode)
  if (!filters.focusPlantCode || !focusLoc) return []

  const peerDistances = new Map()
  candidates.forEach((c) => {
    if (peerDistances.has(c.plant_code)) return
    const dist = c.plant_code === filters.focusPlantCode
      ? 0
      : haversineKm(focusLoc.lat, focusLoc.lng, c.latitude, c.longitude)
    if (dist <= filters.radiusKm) peerDistances.set(c.plant_code, dist)
  })

  const peerRows = candidates
    .filter((r) => peerDistances.has(r.plant_code))
    .map((r) => ({ ...r, distance_from_focus: peerDistances.get(r.plant_code), is_focus_plant: r.plant_code === filters.focusPlantCode }))

  const centerByMaterial = new Map(peerRows.filter((r) => r.is_focus_plant).map((r) => [r.material_code, r]))

  let rows = peerRows.map((row) => {
    const center = centerByMaterial.get(row.material_code)
    if (!center) return null
    const peers = peerRows
      .filter((r) => r.material_code === row.material_code)
      .sort((a, b) => b.total_cost - a.total_cost || b.compare_value - a.compare_value || a.plant_name.localeCompare(b.plant_name, 'th'))
    const benchmarkValue = center.compare_value
    const gapPct = row.is_focus_plant ? 0 : (benchmarkValue > 0 ? ((row.compare_value - benchmarkValue) / benchmarkValue) * 100 : 0)
    return { ...row, gap_pct: gapPct, peer_count: peers.length, benchmark_value: benchmarkValue, benchmark_plant: center.plant_name, benchmark_distance: center.distance_from_focus ?? 0, peers }
  }).filter(Boolean)

  if (filters.gapOnly) rows = rows.filter((r) => r.gap_pct > filters.gapThreshold)

  return rows.sort((a, b) => {
    if (a.is_focus_plant !== b.is_focus_plant) return a.is_focus_plant ? -1 : 1
    return b.gap_pct - a.gap_pct || b.compare_value - a.compare_value || a.plant_name.localeCompare(b.plant_name, 'th')
  })
}

export function computeCapacityRows(contractRows, locationMap, filters) {
  const compareField = priceBasisField(filters.priceBasis)
  const compareLabel = priceBasisLabel(filters.priceBasis)
  const filtersWithField = { ...filters, compareField, compareLabel }

  const candidates = buildRepresentativeRows(contractRows, locationMap, filtersWithField)
    .map((row) => ({ ...row, compare_value: row[compareField] ?? row.total_cost }))

  const focusLoc = locationMap.get(filters.focusPlantCode)
  if (!filters.focusPlantCode || !focusLoc) return []

  const peerDistances = new Map()
  candidates.forEach((c) => {
    if (peerDistances.has(c.plant_code)) return
    const dist = c.plant_code === filters.focusPlantCode
      ? 0
      : haversineKm(focusLoc.lat, focusLoc.lng, c.latitude, c.longitude)
    if (dist <= filters.radiusKm) peerDistances.set(c.plant_code, dist)
  })

  const scoped = candidates
    .filter((r) => peerDistances.has(r.plant_code))
    .map((r) => ({ ...r, distance_from_focus: peerDistances.get(r.plant_code), is_focus_plant: r.plant_code === filters.focusPlantCode }))

  const centerByMaterial = new Map(scoped.filter((r) => r.is_focus_plant).map((r) => [r.material_code, r]))

  let rows = scoped.map((row) => {
    const center = centerByMaterial.get(row.material_code)
    if (!center) return null
    const peers = scoped
      .filter((r) => r.material_code === row.material_code)
      .sort((a, b) => a.compare_value - b.compare_value || a.total_cost - b.total_cost || a.plant_name.localeCompare(b.plant_name, 'th'))
    const benchmarkValue = center.compare_value || row.compare_value
    const gapPct = row.is_focus_plant ? 0 : (benchmarkValue > 0 ? ((row.compare_value - benchmarkValue) / benchmarkValue) * 100 : 0)
    return { ...row, peer_count: peers.length, benchmark_value: benchmarkValue, benchmark_plant: center.plant_name, benchmark_distance: center.distance_from_focus ?? 0, gap_pct: gapPct, peers }
  }).filter(Boolean)

  if (filters.gapOnly) rows = rows.filter((r) => r.gap_pct > filters.gapThreshold)

  return rows.sort((a, b) => {
    if (a.is_focus_plant !== b.is_focus_plant) return a.is_focus_plant ? -1 : 1
    return a.plant_name.localeCompare(b.plant_name, 'th') || a.material_name.localeCompare(b.material_name, 'th')
  })
}

export function getPeerRankStats(row) {
  if (!row?.peers?.length) return { rank: 1, total: 1 }
  const sorted = [...row.peers].sort((a, b) => a.total_cost - b.total_cost || a.compare_value - b.compare_value || a.plant_name.localeCompare(b.plant_name, 'th'))
  const rank = Math.max(sorted.findIndex((p) => p.key === row.key) + 1, 1)
  return { rank, total: sorted.length }
}

export function buildContractSummaryRows(contractRows) {
  const seen = new Set()
  return contractRows.filter((row) => {
    const key = [row.plant_code, row.material_code, row.material_name, row.contract_type, row.source_category, row.source_name, row.transporter_name, row.effective_date, row.end_date, row.total_price].map(clean).join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map((row) => ({
    plant_code: clean(row.plant_code),
    plant_name: clean(row.plant_name),
    material_code: clean(row.material_code),
    material_name: clean(row.material_name),
    material_group: (() => { const c = clean(row.material_code).toUpperCase(); if (c.startsWith('MF')) return 'Fly Ash (MF)'; if (c.startsWith('C')) return 'Cement (C)'; if (c.startsWith('R')) return 'Stone (R)'; if (c.startsWith('S')) return 'Sand (S)'; if (c.startsWith('D')) return 'Admixture Type D'; if (c.startsWith('F')) return 'Admixture Type F'; return 'Other' })(),
    contract_type: clean(row.contract_type) || '-',
    source_category: clean(row.source_category) || '-',
    source_name: clean(row.source_name || row.source_plant_name) || '-',
    transporter_name: clean(row.transporter_name) || '-',
    effective_date: clean(row.effective_date),
    end_date: clean(row.end_date),
  }))
}
