import { useApp } from '../context/AppContext.jsx'
import { FUEL_TYPES, SEARCH_RADIUS_OPTIONS } from '../config/constants.js'
import { IconClose } from './Icons.jsx'

// Bottom-sheet style settings panel. Same data model as the original.
export default function SettingsPanel() {
  const { state, dispatch } = useApp()
  if (!state.showSettings) return null

  function close() { dispatch({ type: 'TOGGLE_SETTINGS' }) }
  function update(key, value) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } })
  }

  const { settings, selectedFuelType } = state

  return (
    <div className="settings-overlay" onClick={close}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button type="button" className="close-btn" onClick={close} aria-label="Close settings">
            <IconClose size={16} sw={2.2} />
          </button>
        </div>

        <div className="settings-body">
          <div className="setting-group">
            <div className="section-title">Your fuel</div>
            <div className="fuel-grid">
              {FUEL_TYPES.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`fuel-tile ${selectedFuelType === f.key ? 'active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_FUEL_TYPE', payload: f.key })}
                >
                  <div className="fuel-tile-key">{shortKey(f.key)}</div>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <div className="section-title">Vehicle</div>
            <SliderRow
              label="Tank size"
              value={settings.tankSize} min={20} max={120} step={5} unit="L"
              onChange={(v) => update('tankSize', v)}
              labels={['20L', '120L']}
            />
            <SliderRow
              label="Current level"
              value={settings.currentFuelLevel} min={0} max={95} step={5} unit="%"
              onChange={(v) => update('currentFuelLevel', v)}
              labels={['Empty', 'Full']}
            />
            <SliderRow
              label="Consumption"
              value={settings.consumptionRate} min={4} max={25} step={0.5} unit=" L/100km"
              onChange={(v) => update('consumptionRate', v)}
              labels={['4 (eco)', '25 (4WD)']}
            />
          </div>

          <div className="setting-group">
            <div className="section-title">Search radius</div>
            <div className="setting-card" style={{ padding: 12 }}>
              <div className="radius-options">
                {SEARCH_RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`radius-btn ${settings.searchRadius === r ? 'active' : ''}`}
                    onClick={() => update('searchRadius', r)}
                  >{r} km</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, unit, onChange, labels }) {
  return (
    <div className="setting-card" style={{ marginBottom: 8 }}>
      <div className="setting-label">
        <span className="setting-label-text">{label}</span>
        <span className="setting-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {labels && (
        <div className="range-labels">
          <span>{labels[0]}</span><span>{labels[1]}</span>
        </div>
      )}
    </div>
  )
}

function shortKey(key) {
  return ({
    'Unleaded': 'U91',
    'e10': 'E10',
    'PULP 95/96 RON': 'P95',
    'PULP 98 RON': 'P98',
    'Diesel': 'DSL',
    'Premium Diesel': 'PDS',
    'LPG': 'LPG',
    'e85': 'E85',
  })[key] || key
}
