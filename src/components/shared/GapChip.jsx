import { getGapClass, formatPct } from '../../utils/formatters'

const COLOR = {
  red: 'bg-red-100 text-red-700 border-red-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function GapChip({ gapPct, neutral }) {
  const cls = neutral ? 'neutral' : getGapClass(gapPct)
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border tabular-nums ${COLOR[cls]}`}>
      {neutral ? '—' : formatPct(gapPct)}
    </span>
  )
}
