import { useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { fetchFuelPrices } from '../services/fuelApi.js'

export function useFuelPrices() {
  const { state, dispatch } = useApp()

  const loadPrices = useCallback(async () => {
    dispatch({ type: 'SET_DATA_LOADING' })
    try {
      const stations = await fetchFuelPrices(state.selectedFuelType)
      dispatch({ type: 'SET_STATIONS', payload: stations })
    } catch (error) {
      dispatch({ type: 'SET_DATA_ERROR', payload: error.message })
    }
  }, [state.selectedFuelType, dispatch])

  useEffect(() => {
    loadPrices()
  }, [loadPrices])

  return {
    stations: state.stations,
    loading: state.dataLoading,
    error: state.dataError,
    lastFetched: state.lastFetched,
    refetch: loadPrices,
  }
}
