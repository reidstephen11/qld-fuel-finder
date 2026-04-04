import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { getDrivingDistances } from '../services/routingApi.js'

export function useDrivingDistance(topStations) {
  const { state, dispatch } = useApp()
  const abortRef = useRef(false)

  useEffect(() => {
    if (!state.userLocation || topStations.length === 0) return

    abortRef.current = false

    // Only fetch for stations we don't already have distances for
    const toFetch = topStations
      .slice(0, 15)
      .filter((s) => !state.drivingDistances.has(s.SiteId))

    if (toFetch.length === 0) return

    getDrivingDistances(
      toFetch,
      state.userLocation.lat,
      state.userLocation.lon,
      (updatedMap) => {
        if (!abortRef.current) {
          const merged = new Map(state.drivingDistances)
          for (const [key, val] of updatedMap) {
            merged.set(key, val)
          }
          dispatch({ type: 'SET_DRIVING_DISTANCES', payload: merged })
        }
      }
    )

    return () => {
      abortRef.current = true
    }
  }, [state.userLocation, topStations.length])
}
