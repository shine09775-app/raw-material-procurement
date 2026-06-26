export default function MapStatusBar({ counts, radius, plants, tableOpen, onToggleTable }) {
  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-6 text-xs shrink-0">
      {/* Factory icon */}
      <div className="flex items-center gap-1.5 text-gray-700 font-medium">
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
        <span>โรงงาน {counts.total} จุดใน {radius} กม.</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold">CPAC</span>
          <span className="font-semibold text-gray-700">{counts.cpac}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">QMIX</span>
          <span className="font-semibold text-gray-700">{counts.qmix}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 bg-gray-400 text-white rounded text-[10px] font-bold">FC</span>
          <span className="font-semibold text-gray-500">{counts.fc} (ไม่มี)</span>
        </div>
      </div>

      {/* Table toggle */}
      <button
        onClick={onToggleTable}
        className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors border border-gray-200 rounded px-2.5 py-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18" />
        </svg>
        <span>ตารางโรงงาน</span>
        <span className="text-[10px] text-gray-400">แสดง {counts.total} โรงงานบนแผนที่</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${tableOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}
