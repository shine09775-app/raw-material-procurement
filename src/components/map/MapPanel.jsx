import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function cpacIcon(type) {
  const bg = type === 'QMIX' ? '#0052a5' : '#c8102e'
  const label = type === 'QMIX' ? 'Q' : 'C'
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg};border:2px solid white;border-radius:4px;
      color:white;font-size:10px;font-weight:700;
      width:22px;height:22px;display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    ">${label}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

const anchorIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;background:#c8102e;border:3px solid white;
    border-radius:50%;box-shadow:0 0 0 2px #c8102e;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) })
  return null
}

function RecenterMap({ center }) {
  const map = useMap()
  useEffect(() => { map.setView([center.lat, center.lng]) }, [center.lat, center.lng])
  return null
}

export default function MapPanel({ anchor, radius, plants, plantsInRadius, onMapClick }) {
  const inRadiusCodes = new Set(plantsInRadius.map((p) => p.code))

  return (
    <div className="relative flex-1" style={{ minHeight: 0 }}>
      {/* Hint overlay */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 text-xs text-gray-600 px-3 py-1 rounded-full shadow border border-gray-200 pointer-events-none">
        🔴 คลิกจุดอื่นเพื่อกรองต่อ
      </div>

      <MapContainer
        center={[anchor.lat, anchor.lng]}
        zoom={10}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={anchor} />
        <ClickHandler onMapClick={onMapClick} />

        {/* Radius circle */}
        <Circle
          center={[anchor.lat, anchor.lng]}
          radius={radius * 1000}
          pathOptions={{
            color: '#c8102e',
            weight: 2,
            fillColor: '#c8102e',
            fillOpacity: 0.04,
          }}
        />

        {/* Anchor point */}
        <Marker position={[anchor.lat, anchor.lng]} icon={anchorIcon} />

        {/* Plant markers */}
        {plants.map((p) => (
          <Marker key={p.code} position={[p.lat, p.lng]} icon={cpacIcon(p.type)}>
            <Popup>
              <div className="text-xs leading-snug">
                <div className="font-bold text-sm">{p.code}: {p.name}</div>
                <div className="text-gray-500 mt-0.5">{p.type} · {p.division}</div>
                {inRadiusCodes.has(p.code) && (
                  <div className="mt-1 text-green-600 font-medium">✓ อยู่ในรัศมี {radius} กม.</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
