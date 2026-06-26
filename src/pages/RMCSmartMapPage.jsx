import { useState, useMemo, useCallback } from 'react'
import MapPanel from '../components/map/MapPanel'
import MapSidebar from '../components/map/MapSidebar'
import MapStatusBar from '../components/map/MapStatusBar'
import { useAppData } from '../context/AppDataContext'
import { haversineKm } from '../utils/haversine'

const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 } // Bangkok
const DEFAULT_RADIUS = 30

export default function RMCSmartMapPage() {
  const { state } = useAppData()
  const { locationMap, orgRows, loading } = state

  const [anchor, setAnchor] = useState(DEFAULT_CENTER)
  const [radius, setRadius] = useState(DEFAULT_RADIUS)
  const [filterGiJan, setFilterGiJan] = useState('ทั้งหมด')
  const [filterPhak, setFilterPhak] = useState('ทั้งหมด')
  const [filterPhaenk, setFilterPhaenk] = useState('ทั้งหมด')
  const [filterChangwat, setFilterChangwat] = useState('ทั้งหมด')
  const [tableOpen, setTableOpen] = useState(true)

  // Build full plant list with org info
  const allPlants = useMemo(() => {
    const plants = []
    locationMap.forEach((loc, code) => {
      if (!isNaN(loc.lat) && !isNaN(loc.lng)) {
        const org = orgRows.find(
          (r) => (r.PLANT_NO || '').trim() === code
        )
        plants.push({
          code,
          name: loc.plant_name || code,
          lat: loc.lat,
          lng: loc.lng,
          type: org?.PLANT_TYPE || 'CPAC',
          division: org?.DIVISION_NAME || '',
          department: org?.DEPARTMENT_NAME || '',
        })
      }
    })
    return plants
  }, [locationMap, orgRows])

  // Plants within radius of anchor
  const plantsInRadius = useMemo(() => {
    return allPlants.filter((p) => {
      const d = haversineKm(anchor.lat, anchor.lng, p.lat, p.lng)
      return d <= radius
    })
  }, [allPlants, anchor, radius])

  const counts = useMemo(() => {
    const cpac = plantsInRadius.filter((p) => p.type === 'CPAC').length
    const qmix = plantsInRadius.filter((p) => p.type === 'QMIX').length
    return { total: plantsInRadius.length, cpac, qmix, fc: 0 }
  }, [plantsInRadius])

  const handleAnchorChange = useCallback((latLng) => {
    setAnchor({ lat: latLng.lat, lng: latLng.lng })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm gap-2">
        <svg className="animate-spin h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        กำลังโหลดข้อมูล...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main area: sidebar + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <MapSidebar
          anchor={anchor}
          radius={radius}
          onAnchorChange={handleAnchorChange}
          onRadiusChange={setRadius}
          filterGiJan={filterGiJan}
          setFilterGiJan={setFilterGiJan}
          filterPhak={filterPhak}
          setFilterPhak={setFilterPhak}
          filterPhaenk={filterPhaenk}
          setFilterPhaenk={setFilterPhaenk}
          filterChangwat={filterChangwat}
          setFilterChangwat={setFilterChangwat}
          orgRows={orgRows}
        />

        {/* Map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MapPanel
            anchor={anchor}
            radius={radius}
            plants={allPlants}
            plantsInRadius={plantsInRadius}
            onMapClick={handleAnchorChange}
          />
        </div>
      </div>

      {/* Bottom status bar */}
      <MapStatusBar
        counts={counts}
        radius={radius}
        plants={plantsInRadius}
        tableOpen={tableOpen}
        onToggleTable={() => setTableOpen((v) => !v)}
      />

      {/* Plant table drawer */}
      {tableOpen && (
        <div className="bg-white border-t border-gray-200 overflow-auto" style={{ maxHeight: 220 }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left font-medium">รหัส</th>
                <th className="px-3 py-2 text-left font-medium">ชื่อโรงงาน</th>
                <th className="px-3 py-2 text-left font-medium">ประเภท</th>
                <th className="px-3 py-2 text-left font-medium">สังกัด</th>
                <th className="px-3 py-2 text-right font-medium">ระยะ (กม.)</th>
              </tr>
            </thead>
            <tbody>
              {plantsInRadius
                .map((p) => ({
                  ...p,
                  dist: haversineKm(anchor.lat, anchor.lng, p.lat, p.lng),
                }))
                .sort((a, b) => a.dist - b.dist)
                .map((p) => (
                  <tr key={p.code} className="border-b border-gray-100 hover:bg-red-50">
                    <td className="px-3 py-1.5 font-mono text-gray-600">{p.code}</td>
                    <td className="px-3 py-1.5 font-medium">{p.name}</td>
                    <td className="px-3 py-1.5">
                      <span
                        className={[
                          'px-1.5 py-0.5 rounded text-white text-[10px] font-bold',
                          p.type === 'QMIX' ? 'bg-blue-600' : 'bg-red-600',
                        ].join(' ')}
                      >
                        {p.type}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">{p.division}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{p.dist.toFixed(1)}</td>
                  </tr>
                ))}
              {plantsInRadius.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                    ไม่มีโรงงานในรัศมีที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
