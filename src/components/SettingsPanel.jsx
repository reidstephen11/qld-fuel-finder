import { useApp } from '../context/AppContext.jsx'
import { SEARCH_RADIUS_OPTIONS } from '../config/constants.js'

export default function SettingsPanel() {
  const { state, dispatch } = useApp()
  const { settings } = state

  if (!state.showSettings) return null

  function update(key, value) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } })
  }

  return (
    <div className="settings-overlay" onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })} aria-label="Close settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <div className="setting-group">
            <div className="setting-label">
              <span>Tank Size</span>
              <span className="setting-value">{settings.tankSize}L</span>
            </div>
            <input
              type="range"
              min="20"
              max="120"
              step="5"
              value={settings.tankSize}
              onChange={(e) => update('tankSize', Number(e.target.value))}
            />
            <div className="range-labels">
              <span>20L</span><span>120L</span>
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-label">
              <span>Current Fuel Level</span>
              <span className="setting-value">{settings.currentFuelLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={settings.currentFuelLevel}
              onChange={(e) => update('currentFuelLevel', Number(e.target.value))}
            />
            <div className="range-labels">
              <span>Empty</span><span>Full</span>
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-label">
              <span>Fuel Consumption</span>
              <span className="setting-value">{settings.consumptionRate} L/100km</span>
            </div>
            <input
              type="range"
              min="4"
              max="25"
              step="0.5"
              value={settings.consumptionRate}
              onChange={(e) => update('consumptionRate', Number(e.target.value))}
            />
            <div className="range-labels">
              <span>4 (eco)</span><span>25 (4WD)</span>
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-label">
              <span>Search Radius</span>
            </div>
            <div className="radius-options">
              {SEARCH_RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  className={`radius-btn ${settings.searchRadius === r ? 'active' : ''}`}
                  onClick={() => update('searchRadius', r)}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
