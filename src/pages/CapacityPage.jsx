import { useState, useMemo } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useFilters } from '../context/FilterContext'
import { computeCapacityRows } from '../utils/benchmark'
import { formatNumber, formatCompact, formatPct, getGapClass, getGapLabel } from '../utils/formatters'
import FilterBar from '../components/shared/FilterBar'
import KPICard from '../components/shared/KPICard'
import GapChip from '../components/shared/GapChip'

export default function CapacityPage() {
  const { state } = useAppData()
  const { filters, dispatch } = useFilters()
  const [selectedKey, setSelectedKey] = useState('')

  const rows = useMemo(() => {
    if (!state.contractRows.length) return []
    return computeCapacityRows(state.contractRows, state.locationMap, filters)
  }, [state.contractRows, state.locationMap, filters])

  const selectedRow = rows.find((r) => r.key === selectedKey) || rows.find((r) => r.is_focus_plant) || rows[0] || null

  const kpi = useMemo(() => {
    const plants = new Set(rows.map((r) => r.plant_code)).size
    const green = rows.filter((r) => getGapClass(r.gap_pct) === 'green').length
    const yellow = rows.filter((r) => getGapClass(r.gap_pct) === 'yellow').length
    const red = rows.filter((r) => getGapClass(r.gap_pct) === 'red').length
    const avg = rows.length ? rows.reduce((s, r) => s + r.gap_pct, 0) / rows.length : 0
    return { plants, green, yellow, red, avg }
  }, [rows])

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <FilterBar onSearch={() => {}} onReset={() => dispatch({ type: 'RESET' })} />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPICard label="Center Plant" value={filters.focusPlantLabel || '—'} sub={`${kpi.plants} plants in peer scope`} accent />
        <KPICard label="Matrix Rows" value={rows.length} sub="Plant × material rows" />
        <KPICard label="🟢 / 🟡 / 🔴" value={`${kpi.green} / ${kpi.yellow} / ${kpi.red}`} sub="Gap color distribution" />
        <KPICard label="Average Gap" value={formatPct(kpi.avg)} sub={`เทียบโดย ${filters.compareLabel}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Matrix Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Plant Material Benchmark Matrix</h2>
          <p className="text-xs text-gray-400 mb-3">
            {filters.focusPlantLabel || '—'} เป็น center plant · รัศมี {filters.radiusKm} km
          </p>
          <div className="overflow-auto" style={{ maxHeight: 460 }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 text-gray-500 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-3 py-2 text-left">โรงงาน</th>
                  <th className="px-3 py-2 text-left">Material</th>
                  <th className="px-3 py-2 text-left">Contract</th>
                  <th className="px-3 py-2 text-left">ประเภท</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Transporter</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Base</th>
                  <th className="px-3 py-2 text-center">Gap</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={10} className="text-center text-gray-400 py-8">ไม่พบข้อมูล</td></tr>
                ) : rows.map((row) => {
                  const gc = getGapClass(row.gap_pct)
                  const isSelected = row.key === selectedRow?.key
                  return (
                    <tr key={row.key} onClick={() => setSelectedKey(row.key)}
                      className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-gray-900 flex items-center gap-1">
                          {row.plant_name}
                          {row.is_focus_plant && <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">Center</span>}
                        </div>
                        <div className="text-gray-400">{row.plant_code} · {formatCompact(row.distance_from_focus, 1)} km</div>
                      </td>
                      <td className="px-3 py-2">{row.material_name}</td>
                      <td className="px-3 py-2 text-gray-500">{row.contract_label}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.source_category === 'หลัก' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {row.source_category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{row.source_name}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{row.transporter_name}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{formatNumber(row.total_cost)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-500">{formatNumber(row.benchmark_value)}</td>
                      <td className="px-3 py-2 text-center"><GapChip gapPct={row.gap_pct} neutral={row.is_focus_plant} /></td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] font-medium ${gc === 'red' ? 'text-red-600' : gc === 'yellow' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {row.is_focus_plant ? '—' : getGapLabel(row.gap_pct)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Peer Detail */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-0.5">
            {selectedRow ? `${selectedRow.plant_name} / ${selectedRow.material_name}` : 'Peer Detail'}
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            {selectedRow ? `${selectedRow.source_name} · ${selectedRow.transporter_name}` : 'คลิกแถวใน matrix เพื่อดูรายละเอียด'}
          </p>

          {selectedRow && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <KPICard label="Total Price" value={formatNumber(selectedRow.total_cost)} sub={selectedRow.contract_label} />
                <KPICard label="Center Base" value={formatNumber(selectedRow.benchmark_value)} sub={`${selectedRow.benchmark_plant} · ${formatCompact(selectedRow.benchmark_distance, 1)} km`} />
                <KPICard label="Gap Status" value={formatPct(selectedRow.gap_pct)} sub={selectedRow.is_focus_plant ? 'Center Plant' : getGapLabel(selectedRow.gap_pct)} />
                <KPICard label="Peer Plants" value={selectedRow.peers.length} sub="same material in radius" />
              </div>

              <div className="overflow-auto" style={{ maxHeight: 240 }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-2 py-1.5 text-left">โรงงาน</th>
                      <th className="px-2 py-1.5 text-right">กม.</th>
                      <th className="px-2 py-1.5 text-right">Total</th>
                      <th className="px-2 py-1.5 text-center">Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedRow.peers]
                      .sort((a, b) => a.compare_value - b.compare_value)
                      .map((peer) => {
                        const peerGap = selectedRow.benchmark_value > 0
                          ? ((peer.compare_value - selectedRow.benchmark_value) / selectedRow.benchmark_value) * 100 : 0
                        return (
                          <tr key={peer.key} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-2 py-1.5">
                              <div className="font-medium">{peer.plant_name}</div>
                              <div className="text-gray-400">{peer.plant_code}</div>
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">{formatCompact(peer.distance_from_focus, 1)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-medium">{formatNumber(peer.total_cost)}</td>
                            <td className="px-2 py-1.5 text-center"><GapChip gapPct={peerGap} neutral={peer.is_focus_plant} /></td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
