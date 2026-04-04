import { useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'

export function useGeolocation() {
  const { state, dispatch } = useApp()

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      dispatch({ type: 'SET_LOCATION_ERROR', payload: 'Geolocation not supported by your browser' })
      return
    }

    dispatch({ type: 'SET_LOCATION_LOADING' })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch({
          type: 'SET_LOCATION',
          payload: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            source: 'gps',
          },
        })
      },
      (error) => {
        let message = 'Unable to get your location'
        if (error.code === 1) message = 'Location permission denied'
        if (error.code === 2) message = 'Location unavailable'
        if (error.code === 3) message = 'Location request timed out'
        dispatch({ type: 'SET_LOCATION_ERROR', payload: message })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [dispatch])

  return {
    location: state.userLocation,
    loading: state.locationLoading,
    error: state.locationError,
    requestLocation,
  }
}
