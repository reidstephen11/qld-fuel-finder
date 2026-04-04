import { useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useApp } from '../context/AppContext.jsx'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../config/constants.js'
import { formatPrice } from '../services/distanceUtils.js'

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const iconCache = {}
function createColorIcon(color) {
  if (iconCache[color]) return iconCache[color]
  const colors = {
    green: '#16a34a',
    yellow: '#d97706',
    red: '#dc2626',
    blue: '#2563eb',
  }
  const fill = colors[color] || colors.yellow
  // Modern rounded pin with subtle shadow
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <defs>
      <filter id="s${color}" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
      </filter>
    </defs>
    <path d="M14 0C6.27 0 0 6.27 0 14C0 24.5 14 40 14 40S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="${fill}" filter="url(#s${color})" stroke="rgba(255,255,255,0.9)" stroke-width="1.5"/>
    <circle cx="14" cy="13" r="5.5" fill="rgba(255,255,255,0.95)"/>
  </svg>`
  const icon = L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  })
  iconCache[color] = icon
  return icon
}

// User location icon - blue dot with white border
const userIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="11" fill="rgba(37,99,235,0.15)" stroke="rgba(37,99,235,0.3)" stroke-width="1"/>
  <circle cx="12" cy="12" r="6" fill="#2563eb" stroke="white" stroke-width="2.5"/>
</svg>`
const userIcon = L.divIcon({
  html: userIconSvg,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

function MapController({ center, stations, selectedStationId, selectedAt, markerRefs }) {
  const map = useMap()
  const hasSetBounds = useRef(false)
  const prevSelectedAt = useRef(null)

  // Pan to selected station and open its popup
  useEffect(() => {
    if (selectedStationId && selectedAt && selectedAt !== prevSelectedAt.current) {
      prevSelectedAt.current = selectedAt
      const markerRef = markerRefs.current.get(selectedStationId)
      if (markerRef) {
        const latlng = markerRef.getLatLng()
        map.flyTo(latlng, 15, { duration: 0.5 })
        setTimeout(() => markerRef.openPopup(), 500)
      }
    }
  }, [selectedStationId, selectedAt, map, markerRefs])

  // Fit bounds when stations first load
  useEffect(() => {
    if (stations.length > 0 && !hasSetBounds.current) {
      const bounds = L.latLngBounds(stations.map((s) => [s.Site_Latitude, s.Site_Longitude]))
      if (center) bounds.extend(center)
      map.fitBounds(bounds, { padding: [30, 30] })
      hasSetBounds.current = true
    } else if (center && !hasSetBounds.current) {
      map.flyTo(center, 13, { duration: 0.5 })
    }
  }, [center, stations.length, map])

  // Reset flag when location changes
  useEffect(() => {
    hasSetBounds.current = false
  }, [center?.[0], center?.[1]])

  return null
}

function StationMarker({ station, dispatch, markerRefs }) {
  const markerRef = useCallback(
    (node) => {
      if (node) {
        markerRefs.current.set(station.SiteId, node)
      }
    },
    [station.SiteId, markerRefs]
  )

  return (
    <Marker
      ref={markerRef}
      position={[station.Site_Latitude, station.Site_Longitude]}
      icon={createColorIcon(station.colorCategory)}
      eventHandlers={{
        click: () => dispatch({ type: 'SELECT_STATION', payload: station }),
      }}
    >
      <Popup>
        <div className="marker-popup">
          <div className="popup-brand">{station.Site_Brand}</div>
          <div className="popup-name">{station.Site_Name}</div>
          <div className="popup-price">{formatPrice(station.Price)}/L</div>
          <div className="popup-detail">
            {station.score.distanceKm} km away
            {station.drivingDuration && ` · ${station.drivingDuration} min drive`}
          </div>
          <div className="popup-effective">
            Effective: {(station.score.effectivePricePerLitre / 100).toFixed(3)}$/L
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${station.Site_Latitude},${station.Site_Longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="popup-nav-link"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Navigate
          </a>
        </div>
      </Popup>
    </Marker>
  )
}

export default function FuelMap({ rankedStations }) {
  const { state, dispatch } = useApp()
  const markerRefs = useRef(new Map())
  const center = state.userLocation
    ? [state.userLocation.lat, state.userLocation.lon]
    : DEFAULT_MAP_CENTER

  // Clean up stale marker refs
  useEffect(() => {
    const validIds = new Set(rankedStations.map((s) => s.SiteId))
    for (const id of markerRefs.current.keys()) {
      if (!validIds.has(id)) markerRefs.current.delete(id)
    }
  }, [rankedStations])

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_MAP_ZOOM}
      className="fuel-map"
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapController
        center={state.userLocation ? [state.userLocation.lat, state.userLocation.lon] : null}
        stations={rankedStations}
        selectedStationId={state.selectedStation?.SiteId}
        selectedAt={state.selectedStation?._selectedAt}
        markerRefs={markerRefs}
      />

      {state.userLocation && (
        <Marker position={[state.userLocation.lat, state.userLocation.lon]} icon={userIcon}>
          <Popup>
            <div className="marker-popup">
              <div className="popup-brand">Your Location</div>
            </div>
          </Popup>
        </Marker>
      )}

      {rankedStations.map((station) => (
        <StationMarker
          key={station.SiteId}
          station={station}
          dispatch={dispatch}
          markerRefs={markerRefs}
        />
      ))}
    </MapContainer>
  )
}
