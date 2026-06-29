import { useState, useMemo } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useFilters } from '../context/FilterContext'
import { computeBenchmarkRows } from '../utils/benchmark'
import { formatCompact, formatPct, formatNumber, getGapClass, exportCsv } from '../utils/formatters'
import FilterBar from '../components/shared/FilterBar'
import KPICard from '../components/shared/KPICard'
import HeatmapTable from '../components/benchmarking/HeatmapTable'
import PeerBarChart from '../components/benchmarking/PeerBarChart'
import SnapshotPanel from '../components/benchmarking/SnapshotPanel'
import cpacLogo from '../../cpac-logo.jpg'

function sortRows(rows, sort) {
  const { field, direction } = sort
  const factor = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    if (a.is_focus_plant !== b.is_focus_plant) return a.is_focus_plant ? -1 : 1
    const diff = (Number(a[field] || 0) - Number(b[field] || 0)) * factor
    if (diff !== 0) return diff
    return a.plant_name.localeCompare(b.plant_name, 'th')
  })
}

export default function BenchmarkingPage() {
  const { state } = useAppData()
  const { filters, dispatch } = useFilters()
  const [focusKey, setFocusKey] = useState('')

  const allRows = useMemo(() => {
    if (!state.contractRows.length) return []
    const rows = computeBenchmarkRows(state.contractRows, state.locationMap, filters)
    return sortRows(rows, filters.heatmapSort)
  }, [state.contractRows, state.locationMap, filters])

  const rows = useMemo(() => {
    const search = (filters.heatmapSearch || '').toLowerCase()
    if (!search) return allRows
    return allRows.filter((r) =>
      r.plant_name.toLowerCase().includes(search) || r.plant_code.toLowerCase().includes(search) || r.material_name.toLowerCase().includes(search)
    )
  }, [allRows, filters.heatmapSearch])

  const focusRow = rows.find((r) => r.key === focusKey) || rows.find((r) => r.is_focus_plant) || rows[0] || null

  function handleSelectRow(row) { setFocusKey(row.key) }
  function handleReset() { dispatch({ type: 'RESET' }); setFocusKey('') }

  // KPI values
  const avgGap = rows.length ? rows.reduce((s, r) => s + r.gap_pct, 0) / rows.length : 0
  const withPeers = rows.filter((r) => r.peer_count > 1).length
  const uniqueMaterials = new Set(rows.map((r) => r.material_name)).size
  const uniquePeers = new Set(rows.map((r) => r.plant_code)).size
  const worst = rows.reduce((m, r) => r.gap_pct > m.gap_pct ? r : m, rows[0] || { gap_pct: 0, plant_name: '—', material_name: '—' })

  function handleExport() {
    exportCsv(rows.map((r) => ({
      plant_code: r.plant_code, plant_name: r.plant_name, material_name: r.material_name,
      source_cost: r.source_cost, transport_cost: r.transport_cost, total_cost: r.total_cost,
      compare_basis: filters.priceBasis, compare_value: r.compare_value,
      benchmark_value: r.benchmark_value, gap_pct: r.gap_pct,
      peer_count: r.peer_count, benchmark_plant: r.benchmark_plant,
    })), 'benchmark-radius-view.csv')
  }

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      {/* Filter Bar */}
      <FilterBar onSearch={() => {}} onReset={handleReset} />

      {/* Context strip */}
      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <span>กำลังดู</span>
        <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{filters.focusPlantLabel || '—'}</span>
        <span>·</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded">{filters.materialCodes.length ? `${filters.materialCodes.length} materials` : 'ทุกวัตถุดิบ'}</span>
        <span>·</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded">{filters.radiusKm} km</span>
        <span>·</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded">{filters.compareLabel}</span>
        <span className="ml-auto">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${state.contractRows.length ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {state.contractRows.length ? 'live data' : 'sample data'}
          </span>
        </span>
      </div>

      {/* KPIs */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          <KPICard label="Center Plant" value={filters.focusPlantLabel || '—'} sub={`${uniquePeers} peer plants ใน ${filters.radiusKm} km`} accent />
          <KPICard label="Visible Plant / Material" value={rows.length} sub={`${uniqueMaterials} material groups`} />
          <KPICard label="Average Gap" value={formatPct(avgGap)} sub={`เทียบโดย ${filters.compareLabel}`} />
          <KPICard label="Rows With Peers" value={withPeers} sub={`Radius ${filters.radiusKm} km`} />
          <KPICard label="Highest Gap" value={formatPct(worst.gap_pct)} sub={`${worst.plant_name} / ${worst.material_name}`} />
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Current Heatmap</h2>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Gap &gt; 5%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />Gap 3–5%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Gap ≤ 2%</span>
          </div>
        </div>
        <HeatmapTable rows={rows} focusKey={focusRow?.key} onSelectRow={handleSelectRow} />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">ราคาต้นทุนรวมรายกลุ่มโรงงาน</h2>
        <p className="text-xs text-gray-400 mb-3">
          ต้นทุน บาท/ตัน รอบ {filters.focusPlantLabel || '—'} ใน {filters.radiusKm} km
        </p>
        <PeerBarChart focusRow={focusRow} filters={filters} />
      </div>

      {/* CPAC Snapshot */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={cpacLogo} alt="CPAC" className="h-6 w-6 rounded object-contain" />
            <h2 className="text-sm font-semibold text-gray-800">CPAC Snapshot</h2>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Radius {filters.radiusKm} km</span>
        </div>
        <SnapshotPanel focusRow={focusRow} rows={rows} filters={filters} />
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <button onClick={handleExport} disabled={!rows.length}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Export CSV
        </button>
      </div>
    </div>
  )
}
