import { useApp } from '../context/AppContext.jsx'
import { FUEL_TYPES } from '../config/constants.js'
import { BrandBadge, BigPrice, IconChevL, IconStar, IconShare, IconNav } from './Icons.jsx'

// Full-screen station detail overlay. Slides up from the bottom.
// Surfaces the "effective price" breakdown — the app's core value prop.
export default function StationDetail({ rankedStations }) {
  const { state, dispatch } = useApp()
  const sel = state.selectedStation
  if (!sel) return null

  const rank = rankedStations.findIndex((s) => s.SiteId === sel.SiteId) + 1
  const fuelLabel = (FUEL_TYPES.find((f) => f.key === state.selectedFuelType) || {}).label
                  || state.selectedFuelType

  function close() { dispatch({ type: 'SELECT_STATION', payload: null }) }

  // Reconstruct breakdown from existing distanceUtils outputs.
  const score = sel.score || {}
  const priceCents = sel.Price / 10
  const effective = (score.effectivePricePerLitre || sel.Price) / 10
  const fillCost = score.fillCostDollars ?? 0
  const travelCost = score.travelCostDollars ?? 0
  const total = score.totalCostDollars ?? (fillCost + travelCost)
  const litres = state.settings.tankSize * (1 - state.settings.currentFuelLevel / 100)

  const tier = sel.colorCategory || 'yellow'
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${sel.Site_Latitude},${sel.Site_Longitude}`

  return (
    <div className="detail-overlay" role="dialog" aria-label="Station detail">
      <div className="detail-hero">
        <button type="button" className="iconbtn detail-back" onClick={close} aria-label="Back">
          <IconChevL size={20} sw={2} />
        </button>
        <button type="button" className="iconbtn detail-fav" aria-label="Save">
          <IconStar size={18} />
        </button>
        {/* The hero stays empty deliberately — the underlying map is visible */}
        <div className="detail-hero-map" />
      </div>

      <div className="detail-card">
        <div className="detail-header">
          <BrandBadge brand={sel.Site_Brand} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="detail-title">{sel.Site_Brand}</div>
            <div className="detail-sub">
              {sel.Sites_Address_Line_1}{sel.Site_Suburb ? `, ${sel.Site_Suburb}` : ''}
            </div>
          </div>
          {rank > 0 && (
            <div className={`detail-rank-badge ${tier}`}>#{rank}</div>
          )}
        </div>

        <div className="detail-price-row">
          <div>
            <div className="section-title" style={{ marginBottom: 6 }}>{fuelLabel}</div>
            <BigPrice price={priceCents} size="xl" />
          </div>
          <div className="detail-stat-list">
            <div className="detail-stat">
              <span className="detail-stat-label">Distance</span>
              <span className="detail-stat-value">{score.distanceKm ?? '—'} km</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Drive</span>
              <span className="detail-stat-value">
                {sel.drivingDuration ? `${sel.drivingDuration} min` : '—'}
              </span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Updated</span>
              <span className="detail-stat-value">
                {formatUpdated(sel.TransactionDateutc)}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-actions">
          <a className="btn-primary" href={navUrl} target="_blank" rel="noopener noreferrer">
            <IconNav size={18} /> Navigate
          </a>
          <button type="button" className="btn-secondary" aria-label="Share">
            <IconShare size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '18px 22px 30px' }}>
        <div className="section-title">What you'll actually pay</div>
        <div className="breakdown-card">
          <div className="breakdown-row">
            <span className="label">Fill {litres.toFixed(0)} L @ {priceCents.toFixed(1)}¢</span>
            <span className="value">${fillCost.toFixed(2)}</span>
          </div>
          <div className="breakdown-row muted">
            <span className="label">
              Drive {(((score.distanceKm) || 0) * 2).toFixed(1)} km @ {state.settings.consumptionRate} L/100km
            </span>
            <span className="value">${travelCost.toFixed(2)}</span>
          </div>
          <div className="breakdown-divider" />
          <div className="breakdown-row total">
            <span className="label">Total</span>
            <span className="value">${total.toFixed(2)}</span>
          </div>
          <div className="breakdown-effective">
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Effective price</span>
            <BigPrice price={effective} size="md" accent />
          </div>
        </div>
      </div>
    </div>
  )
}

function formatUpdated(iso) {
  if (!iso) return '—'
  const date = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  if (isNaN(+date)) return '—'
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
