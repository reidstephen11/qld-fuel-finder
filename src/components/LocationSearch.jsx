import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { geocodeLocation } from '../services/geocodingApi.js'
import { IconSearch, IconCrosshair } from './Icons.jsx'

// Pill-style search with debounced geocoder + GPS button.
export default function LocationSearch() {
  const { dispatch } = useApp()
  const { loading: gpsLoading, requestLocation } = useGeolocation()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function clickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  function handleChange(e) {
    const v = e.target.value
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await geocodeLocation(v)
        setSuggestions(r)
        setOpen(r.length > 0)
      } catch {
        setSuggestions([])
      }
    }, 400)
  }

  function pick(s) {
    dispatch({
      type: 'SET_LOCATION',
      payload: { lat: s.lat, lon: s.lon, source: 'search' },
    })
    setQuery(s.suburb || s.displayName.split(',')[0])
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div className="location-search" ref={wrapperRef}>
      <div className="search-row">
        <div className="search-input-wrapper">
          <span className="search-icon"><IconSearch size={15} sw={2} /></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search suburb, postcode…"
            value={query}
            onChange={handleChange}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
          />
        </div>
        <button
          type="button"
          className={`gps-btn ${gpsLoading ? 'loading' : ''}`}
          onClick={requestLocation}
          disabled={gpsLoading}
          title="Use my location"
          aria-label="Use GPS location"
        >
          <IconCrosshair size={18} sw={2} />
        </button>
      </div>
      {open && (
        <ul className="suggestions-list">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => pick(s)} className="suggestion-item">
              <strong>{s.suburb || s.postcode || s.displayName.split(',')[0]}</strong>
              <span className="suggestion-detail">{s.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
