import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { geocodeLocation } from '../services/geocodingApi.js'

export default function LocationSearch() {
  const { dispatch } = useApp()
  const { loading: gpsLoading, requestLocation } = useGeolocation()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(e) {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await geocodeLocation(value)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch {
        setSuggestions([])
      }
    }, 500)
  }

  function selectSuggestion(suggestion) {
    dispatch({
      type: 'SET_LOCATION',
      payload: { lat: suggestion.lat, lon: suggestion.lon, source: 'search' },
    })
    setQuery(suggestion.suburb || suggestion.displayName.split(',')[0])
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div className="location-search" ref={wrapperRef}>
      <div className="search-row">
        <div className="search-input-wrapper">
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search suburb, postcode, or address..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
        </div>
        <button
          className={`gps-btn ${gpsLoading ? 'loading' : ''}`}
          onClick={requestLocation}
          disabled={gpsLoading}
          title="Use my location"
          aria-label="Use GPS location"
        >
          {gpsLoading ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>
      </div>
      {showSuggestions && (
        <ul className="suggestions-list">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => selectSuggestion(s)} className="suggestion-item">
              <strong>{s.suburb || s.postcode}</strong>
              <span className="suggestion-detail">{s.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
