import { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { rankStations } from '../services/distanceUtils.js'

export function useStationSearch() {
  const { state } = useApp()
  const { stations, userLocation, settings, drivingDistances } = state

  const rankedStations = useMemo(() => {
    if (!userLocation || stations.length === 0) return []

    // Merge driving distances into stations if available
    const stationsWithDistances = stations.map((s) => {
      const driving = drivingDistances.get(s.SiteId)
      if (driving) {
        return { ...s, drivingDistanceKm: driving.distanceKm, drivingDuration: driving.durationMinutes }
      }
      return s
    })

    return rankStations(
      stationsWithDistances,
      userLocation.lat,
      userLocation.lon,
      settings,
      settings.searchRadius
    )
  }, [stations, userLocation, settings, drivingDistances])

  return { rankedStations }
}
