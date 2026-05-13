import { useApp } from '../context/AppContext.jsx'
import LocationSearch from './LocationSearch.jsx'
import { IconSliders, IconFuel } from './Icons.jsx'

// Top bar: brand mark (desktop only) · search · settings button.
// Renders as a floating row above the map.
export default function Header() {
  const { dispatch } = useApp()
  return (
    <div className="topbar">
      <div className="topbar-brand">
        <div className="topbar-brand-mark"><IconFuel size={14} /></div>
        <span>QLD Fuel Finder</span>
      </div>
      <LocationSearch />
      <button
        type="button"
        className="iconbtn"
        onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
        aria-label="Open settings"
        title="Settings"
      >
        <IconSliders size={18} />
      </button>
    </div>
  )
}
