import { useApp } from '../context/AppContext.jsx'
import { formatPrice } from '../services/distanceUtils.js'
import { getDataSource } from '../services/fuelApi.js'

function DataFreshnessBanner({ stations }) {
  const source = getDataSource()
  if (source === 'live') return null

  let latestDate = null
  for (const s of stations) {
    if (s.TransactionDateutc && (!latestDate || s.TransactionDateutc > latestDate)) {
      latestDate = s.TransactionDateutc
    }
  }

  const daysOld = latestDate
    ? Math.floor((Date.now() - new Date(latestDate + 'Z').getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="freshness-banner">
      <div className="freshness-warning">
        {daysOld !== null && daysOld > 2
          ? `Data is ~${daysOld} days old (monthly govt snapshot)`
          : 'Using monthly government data (not real-time)'}
      </div>
      <div className="freshness-tip">
        For live prices, add your API token to <code>.env</code> &mdash;{' '}
        <a href="https://fuelpricesqld.com.au" target="_blank" rel="noopener noreferrer">
          register free here
        </a>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, subtitle, isError }) {
  return (
    <div className={`station-list-empty ${isError ? 'error' : ''}`}>
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-subtitle">{subtitle}</div>
    </div>
  )
}

export default function StationList({ rankedStations }) {
  const { state, dispatch } = useApp()

  if (!state.userLocation) {
    return (
      <EmptyState
        icon={
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        }
        title="Find nearby stations"
        subtitle="Search for a location or tap the GPS button to discover fuel prices near you."
      />
    )
  }

  if (state.dataLoading) {
    return (
      <div className="station-list-empty">
        <div className="spinner" />
        <div className="empty-title">Fetching prices...</div>
        <div className="empty-subtitle">Searching for fuel stations nearby</div>
      </div>
    )
  }

  if (state.dataError) {
    return (
      <EmptyState
        isError
        icon={
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--red)' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        }
        title="Something went wrong"
        subtitle={state.dataError}
      />
    )
  }

  if (rankedStations.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 11h6" />
          </svg>
        }
        title="No stations found"
        subtitle={`Try increasing the search radius beyond ${state.settings.searchRadius} km in settings.`}
      />
    )
  }

  const cheapestPrice = rankedStations[0]?.score.effectivePricePerLitre

  return (
    <div className="station-list">
      <div className="station-list-header">
        <span className="station-count">
          {rankedStations.length} stations
          <span className={`source-badge ${getDataSource()}`}>
            {getDataSource() === 'live' ? 'LIVE' : 'MONTHLY'}
          </span>
        </span>
        {state.lastFetched && (
          <span className="last-updated">
            {state.lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <DataFreshnessBanner stations={rankedStations} />
      {rankedStations.map((station, index) => {
        const isSelected = state.selectedStation?.SiteId === station.SiteId
        const savingsCents = station.score.effectivePricePerLitre - cheapestPrice

        return (
          <div
            key={station.SiteId}
            className={`station-card color-${station.colorCategory} ${isSelected ? 'selected' : ''}`}
            onClick={() => dispatch({ type: 'SELECT_STATION', payload: station })}
          >
            <div className="station-rank">#{index + 1}</div>
            <div className="station-info">
              <div className="station-name-row">
                <span className="station-brand">{station.Site_Brand}</span>
                <span className="station-suburb">{station.Site_Suburb}</span>
              </div>
              <div className="station-address">{station.Sites_Address_Line_1}</div>
              <div className="station-metrics-row">
                <span className="metric-price">
                  {formatPrice(station.Price)}/L
                </span>
                <span className="metric-distance">
                  {station.score.distanceKm} km
                  {station.drivingDuration && ` · ${station.drivingDuration} min`}
                </span>
              </div>
              <div className="station-effective-row">
                <span className="effective-label">Effective:</span>
                <span className="effective-value">
                  {(station.score.effectivePricePerLitre / 100).toFixed(3)}$/L
                </span>
                {index === 0 && <span className="best-badge">BEST VALUE</span>}
                {savingsCents > 0.5 && index !== 0 && (
                  <span className="savings-badge">+{(savingsCents / 100).toFixed(3)}$/L</span>
                )}
              </div>
            </div>
            <a
              className="navigate-btn"
              href={`https://www.google.com/maps/dir/?api=1&destination=${station.Site_Latitude},${station.Site_Longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Get directions"
              aria-label="Navigate to station"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )
      })}
    </div>
  )
}
