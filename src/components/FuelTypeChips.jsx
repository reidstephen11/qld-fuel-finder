import { useApp } from '../context/AppContext.jsx'
import { FUEL_TYPES } from '../config/constants.js'

// Top 5 most-common fuel types as floating chips. Tap to switch.
const PRIMARY = ['Unleaded', 'e10', 'PULP 95/96 RON', 'PULP 98 RON', 'Diesel']

const SHORT_LABEL = {
  'Unleaded': 'U91',
  'e10': 'E10',
  'PULP 95/96 RON': 'P95',
  'PULP 98 RON': 'P98',
  'Diesel': 'Diesel',
  'Premium Diesel': 'Prem. Diesel',
  'LPG': 'LPG',
  'e85': 'E85',
}

export default function FuelTypeChips() {
  const { state, dispatch } = useApp()
  // Show primary 5, but if user's selection isn't in the primary list,
  // surface it at the start.
  const chips = state.selectedFuelType && !PRIMARY.includes(state.selectedFuelType)
    ? [state.selectedFuelType, ...PRIMARY]
    : PRIMARY

  return (
    <div className="fuel-chips">
      {chips.map((key) => (
        <button
          key={key}
          type="button"
          className={`fuel-chip ${state.selectedFuelType === key ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_FUEL_TYPE', payload: key })}
        >
          {SHORT_LABEL[key] || key}
        </button>
      ))}
    </div>
  )
}
