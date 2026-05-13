import { useApp } from '../context/AppContext.jsx'
import { getDataSource } from '../services/fuelApi.js'
import { BrandBadge, BigPrice, TierDot, IconNav, IconSearch, IconPin } from './Icons.jsx'
import { FUEL_TYPES } from '../config/constants.js'

// Best-value hero + ranked list. Uses the same ranking the app already does.
export default function StationList({ rankedStations }) {
  const { state, dispatch } = useApp()
  const fuelLabel = (FUEL_TYPES.find((f) => f.key === state.selectedFuelType) || {}).label
                  || state.selectedFuelType
  const source = getDataSource()

  if (!state.userLocation) {
    return (
      <EmptyState
        icon={<IconPin size={32} sw={1.4} />}
        title="Find nearby stations"
        subtitle="Search for a suburb or tap the GPS button to discover fuel prices near you."
      />
    )
  }

  if (state.dataLoading) {
    return (
      <div className="empty-state">
        <div className="spinner" />
        <div className="empty-title">Fetching prices…</div>
        <div className="empty-subtitle">Looking up stations near you</div>
      </div>
    )
  }

  if (state.dataError) {
    return (
      <EmptyState
        isError
        icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
        title="Something went wrong"
        subtitle={state.dataError}
      />
    )
  }

  if (rankedStations.length === 0) {
    return (
      <EmptyState
        icon={<IconSearch size={32} sw={1.4} />}
        title="No stations found"
        subtitle={`Try increasing the search radius beyond ${state.settings.searchRadius} km in settings.`}
      />
    )
  }

  const cheapestEff = rankedStations[0].score.effectivePricePerLitre
  const best = rankedStations[0]
  const rest = rankedStations.slice(1)

  return (
    <div>
      <div className="list-meta">
        <span className="list-meta-label">
          Best value · {fuelLabel}
          <span className={`source-badge ${source}`}>{source === 'live' ? 'LIVE' : 'MONTHLY'}</span>
        </span>
        <span className="list-meta-count">
          {rankedStations.length} nearby
          {state.lastFetched && ` · ${state.lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </span>
      </div>

      <FreshnessBanner stations={rankedStations} />

      <HeroCard station={best} settings={state.settings} onClick={() => dispatch({ type: 'SELECT_STATION', payload: best })} />

      {rest.length > 0 && (
        <>
          <div className="section-label">Also nearby</div>
          {rest.map((s, i) => (
            <StationRow
              key={s.SiteId}
              station={s}
              rank={i + 2}
              cheapestEff={cheapestEff}
              selected={state.selectedStation?.SiteId === s.SiteId}
              onClick={() => dispatch({ type: 'SELECT_STATION', payload: s })}
            />
          ))}
        </>
      )}
      <div style={{ height: 40 }} />
    </div>
  )
}

// ─── Hero best-value card ────────────────────────────────────────────────
function HeroCard({ station, settings, onClick }) {
  // station.Price is tenths of cents. BigPrice expects cents/L.
  const priceCents = station.Price / 10
  const effective = station.score.effectivePricePerLitre / 10

  return (
    <button type="button" className="hero-card" onClick={onClick}>
      <div className="hero-row">
        <div className="hero-meta">
          <div className="hero-brand-row">
            <BrandBadge brand={station.Site_Brand} size={28} />
            <div style={{ minWidth: 0 }}>
              <div className="hero-brand-name">{station.Site_Brand}</div>
              <div className="hero-brand-sub">
                {station.Sites_Address_Line_1}, {station.Site_Suburb}
              </div>
            </div>
          </div>
          <BigPrice price={priceCents} size="lg" accent />
          <div className="hero-meta-row">
            <span>{station.score.distanceKm} km
              {station.drivingDuration ? ` · ${station.drivingDuration} min` : ''}
            </span>
            <span className="dot">·</span>
            <span>eff. {effective.toFixed(1)}¢</span>
          </div>
        </div>
        <a
          className="hero-cta"
          href={`https://www.google.com/maps/dir/?api=1&destination=${station.Site_Latitude},${station.Site_Longitude}`}
          target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Navigate"
        >
          <IconNav size={18} />
        </a>
      </div>
    </button>
  )
}

// ─── Single list row ─────────────────────────────────────────────────────
function StationRow({ station, rank, cheapestEff, selected, onClick }) {
  const priceCents = station.Price / 10
  const whole = Math.floor(priceCents)
  const dec = Math.round((priceCents - whole) * 10)
  const savings = (station.score.effectivePricePerLitre - cheapestEff) / 10

  return (
    <button
      type="button"
      className={`station-row ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="station-rank">{String(rank).padStart(2, '0')}</div>
      <BrandBadge brand={station.Site_Brand} size={36} />
      <div className="station-info">
        <div className="station-name-row">
          <span className="station-name">{station.Site_Brand}</span>
          <span className="station-suburb">· {station.Site_Suburb}</span>
        </div>
        <div className="station-meta">
          <TierDot tier={station.colorCategory} />
          <span>{station.score.distanceKm} km</span>
          {station.drivingDuration && (
            <>
              <span className="station-meta-dot">·</span>
              <span>{station.drivingDuration} min</span>
            </>
          )}
        </div>
      </div>
      <div className="station-price-block">
        <span className="station-price">
          <span className="whole">{whole}</span>
          <span className="dec">.{dec}</span>
          <span className="unit">¢</span>
        </span>
        <div className={`station-savings ${rank === 1 ? 'best' : ''}`}>
          {rank === 1 ? 'Best value' : savings > 0.3 ? `+${savings.toFixed(1)}¢ eff.` : '—'}
        </div>
      </div>
    </button>
  )
}

// ─── Empty / freshness ───────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle, isError }) {
  return (
    <div className={`empty-state ${isError ? 'error' : ''}`}>
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-subtitle">{subtitle}</div>
    </div>
  )
}

function FreshnessBanner({ stations }) {
  const source = getDataSource()
  if (source === 'live') return null

  let latest = null
  for (const s of stations) {
    if (s.TransactionDateutc && (!latest || s.TransactionDateutc > latest)) {
      latest = s.TransactionDateutc
    }
  }
  const days = latest
    ? Math.floor((Date.now() - new Date(latest + 'Z').getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="freshness-banner">
      <div className="freshness-warning">
        {days != null && days > 2
          ? `Data is ~${days} days old (monthly government snapshot)`
          : 'Showing monthly government data'}
      </div>
      <div className="freshness-tip">
        For live prices, add your API token to <code>.env</code> —{' '}
        <a href="https://fuelpricesqld.com.au" target="_blank" rel="noopener noreferrer">
          register free
        </a>.
      </div>
    </div>
  )
}
