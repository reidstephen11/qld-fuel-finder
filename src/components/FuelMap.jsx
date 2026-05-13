import { useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useApp } from '../context/AppContext.jsx'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../config/constants.js'
import { formatPrice } from '../services/distanceUtils.js'

// ─── Custom div-icon: coloured pill showing price digits ────────────────
const pinCache = {}
function priceIcon(price, tier, selected) {
  // `price` is in tenths-of-cents (1789 → "178")
  const intPrice = Math.floor((price || 0) / 10)
  const key = `${tier}-${intPrice}-${selected ? 's' : 'n'}`
  if (pinCache[key]) return pinCache[key]
  const size = selected ? 40 : 30
  const fontSize = selected ? 12 : 11
  const icon = L.divIcon({
    html: `<div class="fmf-pin ${tier} ${selected ? 'sel' : ''}"
                style="width:${size}px;height:${size}px;font-size:${fontSize}px">${intPrice}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
  pinCache[key] = icon
  return icon
}

const userIcon = L.divIcon({
  html: `<div class="fmf-user-pin"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
})

// Detect dark mode for tile-layer choice
function useDarkMode() {
  const get = () => {
    if (typeof window === 'undefined') return false
    if (document.documentElement.classList.contains('theme-dark')) return true
    if (document.documentElement.classList.contains('theme-light')) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  const ref = useRef(get())
  // We don't trigger a re-render on theme change — just used once to pick tiles.
  return ref.current
}

function MapController({ center, stations, selectedStationId, selectedAt, markerRefs }) {
  const map = useMap()
  const hasSetBounds = useRef(false)
  const prevSelectedAt = useRef(null)

  useEffect(() => {
    if (selectedStationId && selectedAt && selectedAt !== prevSelectedAt.current) {
      prevSelectedAt.current = selectedAt
      const m = markerRefs.current.get(selectedStationId)
      if (m) {
        const latlng = m.getLatLng()
        map.flyTo(latlng, 15, { duration: 0.4 })
      }
    }
  }, [selectedStationId, selectedAt, map, markerRefs])

  useEffect(() => {
    if (stations.length > 0 && !hasSetBounds.current) {
      const bounds = L.latLngBounds(stations.map((s) => [s.Site_Latitude, s.Site_Longitude]))
      if (center) bounds.extend(center)
      // Pad to keep pins clear of the bottom sheet on mobile
      const isDesktop = window.innerWidth >= 1024
      map.fitBounds(bounds, {
        paddingTopLeft: isDesktop ? [40, 100] : [30, 110],
        paddingBottomRight: isDesktop ? [40, 40] : [30, 300],
      })
      hasSetBounds.current = true
    } else if (center && !hasSetBounds.current) {
      map.flyTo(center, 13, { duration: 0.4 })
    }
  }, [center, stations.length, map])

  useEffect(() => {
    hasSetBounds.current = false
  }, [center?.[0], center?.[1]])

  return null
}

function StationMarker({ station, dispatch, markerRefs, selectedId }) {
  const markerRef = useCallback(
    (node) => { if (node) markerRefs.current.set(station.SiteId, node) },
    [station.SiteId, markerRefs]
  )
  const selected = selectedId === station.SiteId

  return (
    <Marker
      ref={markerRef}
      position={[station.Site_Latitude, station.Site_Longitude]}
      icon={priceIcon(station.Price, station.colorCategory, selected)}
      zIndexOffset={station.colorCategory === 'green' ? 200 : 100}
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
            {station.score.distanceKm} km
            {station.drivingDuration && ` · ${station.drivingDuration} min`}
          </div>
          <div className="popup-effective">
            Effective: {(station.score.effectivePricePerLitre / 100).toFixed(3)}/L
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${station.Site_Latitude},${station.Site_Longitude}`}
            target="_blank" rel="noopener noreferrer"
            className="popup-nav-link"
          >
            Navigate →
          </a>
        </div>
      </Popup>
    </Marker>
  )
}

export default function FuelMap({ rankedStations }) {
  const { state, dispatch } = useApp()
  const markerRefs = useRef(new Map())
  const dark = useDarkMode()

  const center = state.userLocation
    ? [state.userLocation.lat, state.userLocation.lon]
    : DEFAULT_MAP_CENTER

  useEffect(() => {
    const valid = new Set(rankedStations.map((s) => s.SiteId))
    for (const id of markerRefs.current.keys()) {
      if (!valid.has(id)) markerRefs.current.delete(id)
    }
  }, [rankedStations])

  // Carto Positron (light) / Dark Matter — minimal cartographic style
  const tileUrl = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_MAP_ZOOM}
      className="fuel-map"
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer
        url={tileUrl}
        attribution='&copy; OSM &copy; CARTO'
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
              <div className="popup-brand">Your location</div>
            </div>
          </Popup>
        </Marker>
      )}

      {rankedStations.map((s) => (
        <StationMarker
          key={s.SiteId}
          station={s}
          dispatch={dispatch}
          markerRefs={markerRefs}
          selectedId={state.selectedStation?.SiteId}
        />
      ))}
    </MapContainer>
  )
}
