import { useMemo } from 'react'
import { useAppData } from '../context/AppDataContext'
import { buildContractSummaryRows } from '../utils/benchmark'
import { formatListPreview } from '../utils/formatters'
import KPICard from '../components/shared/KPICard'

function createSummaryMap(rows, keyFn, seedFn, accFn) {
  const map = new Map()
  rows.forEach((row) => {
    const key = keyFn(row)
    if (!map.has(key)) map.set(key, seedFn(row))
    accFn(map.get(key), row)
  })
  return [...map.values()]
}

export default function ContractSummaryPage() {
  const { state } = useAppData()

  const rows = useMemo(() => buildContractSummaryRows(state.contractRows), [state.contractRows])

  const kpi = useMemo(() => ({
    records: rows.length,
    plants: new Set(rows.map((r) => r.plant_code)).size,
    sources: new Set(rows.map((r) => r.source_name)).size,
    transporters: new Set(rows.map((r) => r.transporter_name)).size,
    primary: rows.filter((r) => r.source_category === 'หลัก').length,
    backup: rows.filter((r) => r.source_category === 'สำรอง').length,
  }), [rows])

  const sourceRows = useMemo(() =>
    createSummaryMap(rows,
      (r) => `${r.source_name}||${r.source_category}||${r.material_group}`,
      (r) => ({ source_name: r.source_name, category: r.source_category, material_group: r.material_group, plants: new Set(), count: 0 }),
      (acc, r) => { acc.plants.add(r.plant_code); acc.count++ }
    ).map((r) => ({ ...r, plant_count: r.plants.size }))
      .sort((a, b) => b.plant_count - a.plant_count)
  , [rows])

  const materialRows = useMemo(() =>
    createSummaryMap(rows,
      (r) => r.material_group,
      (r) => ({ group: r.material_group, records: 0, sources: new Set(), transporters: new Set(), plants: new Set() }),
      (acc, r) => { acc.records++; acc.sources.add(r.source_name); acc.transporters.add(r.transporter_name); acc.plants.add(r.plant_code) }
    ).sort((a, b) => b.records - a.records)
  , [rows])

  const transporterRows = useMemo(() =>
    createSummaryMap(rows,
      (r) => r.transporter_name,
      (r) => ({ transporter: r.transporter_name, plants: new Set(), sources: new Set(), count: 0 }),
      (acc, r) => { acc.plants.add(r.plant_code); acc.sources.add(r.source_name); acc.count++ }
    ).map((r) => ({ ...r, plant_count: r.plants.size, source_count: r.sources.size }))
      .sort((a, b) => b.plant_count - a.plant_count)
  , [rows])

  if (!rows.length) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">ยังไม่มีข้อมูลสัญญา</div>
  }

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      {/* KPIs */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard label="Records" value={kpi.records} accent />
        <KPICard label="Plants Served" value={kpi.plants} />
        <KPICard label="Sources" value={kpi.sources} />
        <KPICard label="Transporters" value={kpi.transporters} />
        <KPICard label="Primary (หลัก)" value={kpi.primary} />
        <KPICard label="Backup (สำรอง)" value={kpi.backup} />
      </div>

      {/* Source Coverage */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Source Coverage</h2>
        <div className="overflow-auto" style={{ maxHeight: 320 }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left">Source Name</th>
                <th className="px-3 py-2 text-left">Material Group</th>
                <th className="px-3 py-2 text-center">ประเภท</th>
                <th className="px-3 py-2 text-right">จำนวนโรงงาน</th>
                <th className="px-3 py-2 text-right">Records</th>
              </tr>
            </thead>
            <tbody>
              {sourceRows.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-1.5 font-medium">{r.source_name}</td>
                  <td className="px-3 py-1.5 text-gray-500">{r.material_group}</td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.category === 'หลัก' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.plant_count}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Group Snapshot */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Material Group Snapshot</h2>
        <div className="overflow-auto" style={{ maxHeight: 280 }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left">กลุ่มวัตถุดิบ</th>
                <th className="px-3 py-2 text-right">Records</th>
                <th className="px-3 py-2 text-right">Sources</th>
                <th className="px-3 py-2 text-right">Transporters</th>
                <th className="px-3 py-2 text-right">Plants</th>
              </tr>
            </thead>
            <tbody>
              {materialRows.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-1.5 font-medium">{r.group}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.records}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.sources.size}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.transporters.size}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.plants.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transporter Coverage */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Transporter Coverage</h2>
        <div className="overflow-auto" style={{ maxHeight: 280 }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left">Transporter</th>
                <th className="px-3 py-2 text-right">โรงงาน</th>
                <th className="px-3 py-2 text-right">Sources</th>
                <th className="px-3 py-2 text-right">Records</th>
              </tr>
            </thead>
            <tbody>
              {transporterRows.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-1.5 font-medium">{r.transporter}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.plant_count}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.source_count}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
