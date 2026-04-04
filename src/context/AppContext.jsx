import { createContext, useContext, useReducer, useEffect } from 'react'
import { DEFAULT_SETTINGS } from '../config/constants.js'

const AppContext = createContext(null)

function loadSettings() {
  try {
    const saved = localStorage.getItem('fuelFinderSettings')
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

const initialState = {
  userLocation: null,
  locationLoading: false,
  locationError: null,

  stations: [],
  dataLoading: false,
  dataError: null,
  lastFetched: null,

  settings: loadSettings(),
  selectedFuelType: localStorage.getItem('fuelFinderFuelType') || 'Unleaded',

  selectedStation: null,
  showSettings: false,

  drivingDistances: new Map(),
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOCATION':
      return { ...state, userLocation: action.payload, locationLoading: false, locationError: null }
    case 'SET_LOCATION_LOADING':
      return { ...state, locationLoading: true, locationError: null }
    case 'SET_LOCATION_ERROR':
      return { ...state, locationError: action.payload, locationLoading: false }
    case 'SET_STATIONS':
      return { ...state, stations: action.payload, dataLoading: false, dataError: null, lastFetched: new Date() }
    case 'SET_DATA_LOADING':
      return { ...state, dataLoading: true, dataError: null }
    case 'SET_DATA_ERROR':
      return { ...state, dataError: action.payload, dataLoading: false }
    case 'SET_FUEL_TYPE':
      return { ...state, selectedFuelType: action.payload }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'SELECT_STATION':
      return { ...state, selectedStation: { ...action.payload, _selectedAt: Date.now() } }
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings }
    case 'SET_DRIVING_DISTANCES':
      return { ...state, drivingDistances: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Persist settings
  useEffect(() => {
    localStorage.setItem('fuelFinderSettings', JSON.stringify(state.settings))
  }, [state.settings])

  useEffect(() => {
    localStorage.setItem('fuelFinderFuelType', state.selectedFuelType)
  }, [state.selectedFuelType])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
