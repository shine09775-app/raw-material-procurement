import { useFilters } from '../../context/FilterContext'
import { formatNumber, formatCompact, getGapClass } from '../../utils/formatters'
import { getPeerRankStats } from '../../utils/benchmark'
import GapChip from '../shared/GapChip'

const SORT_FIELDS = [
  { field: 'source_cost', label: 'ค่าวัตถุดิบ' },
  { field: 'transport_cost', label: 'ค่าขนส่ง' },
  { field: 'total_cost', label: 'ราคารวม' },
  { field: 'gap_pct', label: 'Gap%' },
]

export default function HeatmapTable({ rows, focusKey, onSelectRow }) {
  const { filters, dispatch } = useFilters()
  const { heatmapSort, heatmapSearch, focusPlantLabel, radiusKm, compareLabel } = filters

  function handleSort(field) {
    dispatch({ type: 'TOGGLE_SORT', field })
  }

  function SortBtn({ field, label }) {
    const active = heatmapSort.field === field
    return (
      <button onClick={() => handleSort(field)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors ${active ? 'text-red-600' : 'text-gray-500 hover:text-gray-800'}`}>
        {label}
        <span>{active ? (heatmapSort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    )
  }

  return (
    <div>
      {/* Subtitle */}
      <p className="text-xs text-gray-400 mb-2">
        {focusPlantLabel || '—'} เป็น Center Plant · peers เทียบกับ {compareLabel} ภายใน {radiusKm} km
      </p>

      {/* Search */}
      <input value={heatmapSearch}
        onChange={(e) => dispatch({ type: 'SET', key: 'heatmapSearch', value: e.target.value })}
        placeholder="ค้นหาโรงงาน / วัตถุดิบ..."
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-red-500" />

      {/* Header */}
      <div className="grid text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-t-lg px-3 py-2"
        style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 80px' }}>
        <div>โรงงาน</div>
        <div>Material / Base</div>
        {SORT_FIELDS.map((f) => (
          <div key={f.field} className="text-center"><SortBtn field={f.field} label={f.label} /></div>
        ))}
        <div className="text-center">Rank</div>
      </div>

      {/* Rows */}
      <div className="border border-t-0 border-gray-200 rounded-b-lg overflow-auto" style={{ maxHeight: 420 }}>
        {!rows.length ? (
          <div className="text-center text-gray-400 text-sm py-8">ไม่พบข้อมูลที่ตรงกับเงื่อนไขที่เลือก</div>
        ) : rows.map((row) => {
          const gapClass = row.is_focus_plant ? 'neutral' : getGapClass(row.gap_pct)
          const rankStats = getPeerRankStats(row)
          const COLOR = { red: 'bg-red-50 border-red-200', yellow: 'bg-yellow-50 border-yellow-200', green: 'bg-green-50 border-green-200', neutral: 'bg-blue-50 border-blue-200' }
          const TOTAL_COLOR = { red: 'text-red-700 font-bold', yellow: 'text-yellow-700 font-bold', green: 'text-green-700 font-bold', neutral: 'text-blue-700 font-bold' }
          const isActive = row.key === focusKey

          return (
            <button key={row.key} onClick={() => onSelectRow(row)}
              className={`w-full grid text-left text-xs border-b border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors ${isActive ? `${COLOR[gapClass]} border-l-4` : ''}`}
              style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 80px' }}>

              {/* Plant cell */}
              <div className="pr-2">
                <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                  {row.plant_name}
                  {row.is_focus_plant && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">Center</span>}
                </div>
                <div className="text-gray-400">{row.plant_code} · {row.contract_label}</div>
                <div className="text-gray-400">source: {row.source_name}</div>
                <div className="text-gray-300">{formatCompact(row.distance_from_focus || 0, 1)} km จาก center</div>
              </div>

              {/* Material cell */}
              <div className="pr-2">
                <div className="font-medium text-gray-800">{row.material_name}</div>
                <div className="text-gray-400">Base: {formatNumber(row.benchmark_value)}</div>
                <div className="text-gray-300 text-[10px]">{row.benchmark_plant} ({formatCompact(row.benchmark_distance, 1)} km)</div>
              </div>

              {/* Cost pills */}
              <div className="text-center tabular-nums text-gray-600">{formatNumber(row.source_cost)}</div>
              <div className="text-center tabular-nums text-gray-600">{formatNumber(row.transport_cost)}</div>
              <div className={`text-center tabular-nums ${TOTAL_COLOR[gapClass]}`}>{formatNumber(row.total_cost)}</div>
              <div className="text-center"><GapChip gapPct={row.gap_pct} neutral={row.is_focus_plant} /></div>
              <div className="text-center text-gray-500">{rankStats.rank}/{rankStats.total}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
