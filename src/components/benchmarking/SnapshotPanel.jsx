import { formatNumber, formatCompact, formatPct } from '../../utils/formatters'
import { getPeerRankStats } from '../../utils/benchmark'
import KPICard from '../shared/KPICard'

export default function SnapshotPanel({ focusRow, rows, filters }) {
  const { focusPlantLabel, radiusKm, compareLabel } = filters

  if (!focusRow) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPICard label="Snapshot" value="—" sub="No benchmark row selected" />
      </div>
    )
  }

  const avgPeerTotal = focusRow.peers.reduce((s, p) => s + p.total_cost, 0) / Math.max(focusRow.peers.length, 1)
  const focusRank = getPeerRankStats(focusRow)
  const centerRow = rows.find((r) => r.is_focus_plant && r.material_code === focusRow.material_code) || null
  const centerRank = centerRow ? getPeerRankStats(centerRow) : null
  const avgGap = rows.length ? rows.reduce((s, r) => s + r.gap_pct, 0) / rows.length : 0

  return (
    <div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPICard
          label="Center Plant"
          value={focusPlantLabel || '—'}
          sub={centerRow ? `Price rank ${centerRank.rank}/${centerRank.total}` : `Peer radius ${radiusKm} km`}
        />
        <KPICard
          label={`${compareLabel} ของ row ที่เลือก`}
          value={formatNumber(focusRow.compare_value)}
          sub={`${focusRow.plant_name} · rank ${focusRank.rank}/${focusRank.total}`}
        />
        <KPICard
          label="Center Plant Base"
          value={formatNumber(focusRow.benchmark_value)}
          sub={`${focusRow.benchmark_plant} ห่าง ${formatCompact(focusRow.benchmark_distance, 1)} km`}
        />
        <KPICard
          label="Gap ปัจจุบัน / Peer Avg"
          value={`${formatPct(focusRow.gap_pct)} / ${formatNumber(avgPeerTotal)}`}
          sub={`scope avg gap ${formatPct(avgGap)}`}
        />
      </div>

      <p className="text-xs text-gray-400 mt-3 leading-relaxed">
        Representative row rule: เลือก source_category = "หลัก" ก่อน ถ้าไม่มีใช้รายการที่ total ต่ำสุด.
        Peer group ใช้โรงงานศูนย์กลาง "{focusPlantLabel || '—'}" และคำนวณ Gap เทียบกับราคา Center Plant
        ของ material เดียวกันภายใน Radius {radiusKm} km.
      </p>
    </div>
  )
}
