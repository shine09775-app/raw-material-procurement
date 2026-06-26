import { useState } from 'react'

const RADIUS_STEPS = [10, 30, 50, 80, 120]

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export default function MapSidebar({
  anchor, radius, onAnchorChange, onRadiusChange,
  filterGiJan, setFilterGiJan,
  filterPhak, setFilterPhak,
  filterPhaenk, setFilterPhaenk,
  filterChangwat, setFilterChangwat,
  orgRows,
}) {
  const [latInput, setLatInput] = useState(anchor.lat.toFixed(6))
  const [lngInput, setLngInput] = useState(anchor.lng.toFixed(6))
  const [filterOpen, setFilterOpen] = useState(true)
  const [pinOpen, setPinOpen] = useState(true)

  // Sync inputs when anchor changes from map click
  if (Math.abs(parseFloat(latInput) - anchor.lat) > 0.0001) setLatInput(anchor.lat.toFixed(6))
  if (Math.abs(parseFloat(lngInput) - anchor.lng) > 0.0001) setLngInput(anchor.lng.toFixed(6))

  function handleGoToPin() {
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)
    if (!isNaN(lat) && !isNaN(lng)) onAnchorChange({ lat, lng })
  }

  function handleReset() {
    setLatInput('13.756300')
    setLngInput('100.501800')
    onAnchorChange({ lat: 13.7563, lng: 100.5018 })
  }

  return (
    <aside
      className="bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0"
      style={{ width: 300 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">RMC Smart Map</div>
          <div className="text-xs text-gray-400">แผนที่โรงงานและขอบเขตพื้นที่</div>
        </div>
      </div>

      {/* Filter section */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          <span>กรองหน่วยงาน</span>
          <svg className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {filterOpen && (
          <div className="px-4 pb-4 flex flex-col gap-3">
            <FilterSelect label="กิจการ" value={filterGiJan} onChange={setFilterGiJan} options={['ทั้งหมด', 'CPAC', 'QMIX']} />
            <FilterSelect label="ภาค" value={filterPhak} onChange={setFilterPhak} options={['ทั้งหมด']} />
            <FilterSelect label="แผนก" value={filterPhaenk} onChange={setFilterPhaenk} options={['ทั้งหมด']} />
            <FilterSelect label="จังหวัด" value={filterChangwat} onChange={setFilterChangwat} options={['ทั้งหมด']} />
          </div>
        )}
      </div>

      {/* Pin section */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setPinOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          <span>พิกัดหน่วยงาน</span>
          <svg className={`w-4 h-4 transition-transform ${pinOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {pinOpen && (
          <div className="px-4 pb-4 flex flex-col gap-3">
            {/* Coord display */}
            <div className="text-xs text-gray-500">Lat, Lng หรือ Google Maps link</div>
            <div className="text-sm font-mono bg-gray-50 rounded px-3 py-2 border border-gray-200 text-gray-700">
              {anchor.lat.toFixed(6)}, {anchor.lng.toFixed(6)}
            </div>

            <div className="text-xs text-gray-500">วางพิกัดหรือลิงก์ Google Maps</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-gray-400 mb-0.5">Latitude</div>
                <input
                  type="number"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                  step="0.000001"
                />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 mb-0.5">Longitude</div>
                <input
                  type="number"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                  step="0.000001"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGoToPin}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 rounded flex items-center justify-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                ไปยังพิกัด
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Radius slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">รัศมีพิกัดที่เลือก</span>
                <span className="text-xs font-semibold text-red-600">{radius} กม.</span>
              </div>
              <input
                type="range"
                min={0}
                max={RADIUS_STEPS.length - 1}
                value={RADIUS_STEPS.indexOf(radius) === -1 ? 1 : RADIUS_STEPS.indexOf(radius)}
                onChange={(e) => onRadiusChange(RADIUS_STEPS[parseInt(e.target.value)])}
                className="w-full accent-red-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                {RADIUS_STEPS.map((s) => <span key={s}>{s}</span>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
