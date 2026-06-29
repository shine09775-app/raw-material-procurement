import { formatNumber, formatCompact, getGapClass } from '../../utils/formatters'

const BAR_MAX_H = 280

export default function PeerBarChart({ focusRow, filters }) {
  if (!focusRow) {
    return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">เลือกโรงงานจาก heatmap เพื่อดู peer chart</div>
  }

  const { peers, benchmark_value, key: selfKey } = focusRow
  const { focusPlantLabel, radiusKm, compareLabel } = filters
  const maxTotal = Math.max(...peers.map((p) => p.total_cost), 1)

  return (
    <div>
      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[
          `Center: ${focusPlantLabel || '—'}`,
          `Row: ${focusRow.plant_name}`,
          `Material: ${focusRow.material_name}`,
          `Base: ${formatNumber(benchmark_value)}`,
          `Peers: ${peers.length}`,
        ].map((t) => (
          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500 mb-3">
        <span><span className="inline-block w-3 h-3 rounded-sm bg-blue-400 mr-1 align-middle" />ค่าวัตถุดิบ</span>
        <span><span className="inline-block w-3 h-3 rounded-sm bg-purple-400 mr-1 align-middle" />อื่น ๆ</span>
        <span><span className="inline-block w-3 h-3 rounded-sm bg-teal-400 mr-1 align-middle" />ค่าขนส่ง</span>
      </div>

      {/* Bars */}
      <div className="flex gap-2 items-end overflow-x-auto pb-2" style={{ minHeight: BAR_MAX_H + 60 }}>
        {peers.map((peer) => {
          const totalH = Math.max(18, (peer.total_cost / maxTotal) * BAR_MAX_H)
          const rawH = totalH * ((peer.source_cost || 0) / Math.max(peer.total_cost, 1))
          const transH = totalH * ((peer.transport_cost || 0) / Math.max(peer.total_cost, 1))
          const otherH = Math.max(0, totalH - rawH - transH)
          const peerGap = benchmark_value > 0 ? ((peer.compare_value - benchmark_value) / benchmark_value) * 100 : 0
          const gc = getGapClass(peerGap)
          const isSelf = peer.key === selfKey
          const LABEL_COLOR = { red: 'text-red-600', yellow: 'text-yellow-600', green: 'text-green-600', neutral: 'text-blue-600' }

          return (
            <div key={peer.key} className="flex flex-col items-center gap-1 min-w-[52px]">
              <div className="text-[10px] text-gray-500 tabular-nums">{formatNumber(peer.total_cost)}</div>
              <div className={`flex flex-col-reverse rounded-sm overflow-hidden w-10 ${isSelf ? 'ring-2 ring-blue-400' : ''}`}
                style={{ height: totalH }}
                title={`${peer.plant_name} | ${compareLabel} ${formatNumber(peer.compare_value)}`}>
                {transH > 0 && <div className="bg-teal-400 flex-shrink-0" style={{ height: transH }} />}
                {otherH > 0 && <div className="bg-purple-400 flex-shrink-0" style={{ height: otherH }} />}
                {rawH > 0 && <div className="bg-blue-400 flex-shrink-0" style={{ height: rawH }} />}
              </div>
              <div className={`text-[10px] text-center leading-tight max-w-[52px] truncate font-medium ${LABEL_COLOR[gc]} ${isSelf ? 'font-bold' : ''}`}
                title={peer.plant_name}>
                {peer.plant_name}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
