export const clean = (v) => String(v ?? '').trim()

export function parseNumber(v, fallback = 0) {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''))
  return isNaN(n) ? fallback : n
}

export function parseDateValue(v) {
  const s = clean(v)
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export function formatNumber(v) {
  const n = parseNumber(v)
  return n === 0 ? '-' : n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatCompact(v, digits = 1) {
  const n = parseNumber(v)
  return n.toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function formatPct(v) {
  const n = parseNumber(v)
  return (n >= 0 ? '+' : '') + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
}

export function getGapClass(gapPct) {
  if (gapPct > 5) return 'red'
  if (gapPct >= 3) return 'yellow'
  return 'green'
}

export function getGapLabel(gapPct) {
  if (gapPct > 5) return 'Gap > 5%'
  if (gapPct >= 3) return 'Gap 3–5%'
  return 'Gap ≤ 2%'
}

export function materialTypeOf(materialName, materialCode = '') {
  const code = clean(materialCode).toUpperCase()
  const name = clean(materialName)
  if (code.startsWith('R')) return 'rock'
  if (code.startsWith('S')) return 'sand'
  if (name.includes('ทราย') || name.includes('ฝุ่น')) return 'sand'
  if (name.includes('หิน')) return 'rock'
  return ''
}

export function materialGroupFromCode(materialCode) {
  const code = clean(materialCode).toUpperCase()
  if (code.startsWith('MF')) return 'Fly Ash (MF)'
  if (code.startsWith('C')) return 'Cement (C)'
  if (code.startsWith('R')) return 'Stone (R)'
  if (code.startsWith('S')) return 'Sand (S)'
  if (code.startsWith('D')) return 'Admixture Type D'
  if (code.startsWith('F')) return 'Admixture Type F'
  return 'Other'
}

export function dateOverlaps(row, fromDate, toDate) {
  if (!fromDate && !toDate) return true
  const eff = parseDateValue(row.effective_date)
  const end = parseDateValue(row.end_date)
  if (!eff && !end) return true
  const from = fromDate ? new Date(fromDate) : null
  const to = toDate ? new Date(toDate) : null
  if (from && end && end < from) return false
  if (to && eff && eff > to) return false
  return true
}

export function contractModelOf(row) {
  const t = clean(row.contract_type).toLowerCase()
  if (t.includes('1') || t.includes('type1') || t.includes('type 1')) return 'type1'
  if (t.includes('2') || t.includes('type2') || t.includes('type 2')) return 'type2'
  return 'other'
}

export function priceBasisField(value) {
  if (value === 'transport') return 'transport_cost'
  if (value === 'source') return 'source_cost'
  return 'total_cost'
}

export function priceBasisLabel(value) {
  if (value === 'transport') return 'ค่าขนส่ง'
  if (value === 'source') return 'ค่าวัตถุดิบ'
  return 'ราคารวม'
}

export function formatListPreview(values, limit = 3) {
  const list = [...values].filter(Boolean)
  if (!list.length) return '-'
  if (list.length <= limit) return list.join(', ')
  return `${list.slice(0, limit).join(', ')} +${list.length - limit}`
}

export function exportCsv(rows, filename = 'export.csv') {
  if (!rows.length) return
  const header = Object.keys(rows[0])
  const body = rows.map((row) =>
    header.map((k) => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csv = [header.join(','), ...body].join('\r\n')
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
