import { useApp } from '../context/AppContext.jsx'
import { FUEL_TYPES } from '../config/constants.js'

export default function Header() {
  const { state, dispatch } = useApp()

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 22V8l6-6 6 6v14" />
            <path d="M15 22V13l4-2v11" />
            <path d="M19 11l2-1v-2l-2-2-2 2" />
            <rect x="7" y="12" width="4" height="4" rx="0.5" />
          </svg>
        </div>
        <h1 className="header-title">QLD Fuel Finder</h1>
      </div>
      <div className="header-right">
        <select
          className="fuel-select"
          value={state.selectedFuelType}
          onChange={(e) => dispatch({ type: 'SET_FUEL_TYPE', payload: e.target.value })}
        >
          {FUEL_TYPES.map((ft) => (
            <option key={ft.key} value={ft.key}>{ft.label}</option>
          ))}
        </select>
        <button
          className="settings-btn"
          onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          title="Settings"
          aria-label="Open settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </header>
  )
}
