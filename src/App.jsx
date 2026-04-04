import Header from './components/Header.jsx'
import LocationSearch from './components/LocationSearch.jsx'
import FuelMap from './components/FuelMap.jsx'
import StationList from './components/StationList.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { useFuelPrices } from './hooks/useFuelPrices.js'
import { useStationSearch } from './hooks/useStationSearch.js'
import { useDrivingDistance } from './hooks/useDrivingDistance.js'
import './App.css'

export default function App() {
  useFuelPrices()
  const { rankedStations } = useStationSearch()
  useDrivingDistance(rankedStations)

  return (
    <div className="app">
      <Header />
      <div className="toolbar">
        <LocationSearch />
      </div>
      <div className="main-content">
        <div className="map-panel">
          <FuelMap rankedStations={rankedStations} />
        </div>
        <div className="list-panel">
          <StationList rankedStations={rankedStations} />
        </div>
      </div>
      <SettingsPanel />
    </div>
  )
}
