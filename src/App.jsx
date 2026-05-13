import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import FuelMap from './components/FuelMap.jsx'
import StationList from './components/StationList.jsx'
import StationDetail from './components/StationDetail.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import BottomSheet from './components/BottomSheet.jsx'
import FuelTypeChips from './components/FuelTypeChips.jsx'
import { useApp } from './context/AppContext.jsx'
import { useFuelPrices } from './hooks/useFuelPrices.js'
import { useStationSearch } from './hooks/useStationSearch.js'
import { useDrivingDistance } from './hooks/useDrivingDistance.js'
import { useGeolocation } from './hooks/useGeolocation.js'
import { IconCrosshair } from './components/Icons.jsx'
import './App.css'

export default function App() {
  useFuelPrices()
  const { rankedStations } = useStationSearch()
  useDrivingDistance(rankedStations)

  const { state } = useApp()
  const { loading: gpsLoading, requestLocation } = useGeolocation()

  const [sheetState, setSheetState] = useState('peek')

  // Auto-expand the sheet once stations have loaded
  useEffect(() => {
    if (rankedStations.length > 0 && sheetState === 'peek') {
      setSheetState('half')
    }
  }, [rankedStations.length])

  // GPS FAB sits above the current sheet height (mobile only).
  // Hidden at 'full' since the sheet then covers the map anyway.
  const fabBottom = sheetState === 'peek' ? 184 : 'calc(46vh + 16px)'
  const showFab = sheetState !== 'full'

  return (
    <div className="app">
      <div className="app-map-layer">
        <FuelMap rankedStations={rankedStations} />
      </div>

      <Header />
      <FuelTypeChips />

      {showFab && (
        <button
          type="button"
          className={`gps-fab ${gpsLoading ? 'loading' : ''}`}
          style={{ bottom: fabBottom }}
          onClick={requestLocation}
          aria-label="Recenter on my location"
          title="My location"
        >
          <IconCrosshair size={18} sw={2} />
        </button>
      )}

      <BottomSheet state={sheetState} onChange={setSheetState}>
        <StationList rankedStations={rankedStations} />
      </BottomSheet>

      {state.selectedStation && <StationDetail rankedStations={rankedStations} />}
      <SettingsPanel />
    </div>
  )
}
