import { OSRM_URL } from '../config/constants.js'

const DELAY_MS = 150

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getDrivingDistance(fromLat, fromLon, toLat, toLon) {
  const url = `${OSRM_URL}/${fromLon},${fromLat};${toLon},${toLat}?overview=false`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.code === 'Ok' && data.routes.length > 0) {
      return {
        distanceKm: Math.round((data.routes[0].distance / 1000) * 10) / 10,
        durationMinutes: Math.round(data.routes[0].duration / 60),
      }
    }
  } catch {
    // Silently fail — Haversine is used as fallback
  }
  return null
}

export async function getDrivingDistances(stations, fromLat, fromLon, onUpdate) {
  const results = new Map()

  for (const station of stations) {
    const result = await getDrivingDistance(
      fromLat, fromLon,
      station.Site_Latitude, station.Site_Longitude
    )

    if (result) {
      results.set(station.SiteId, result)
      if (onUpdate) onUpdate(new Map(results))
    }

    await delay(DELAY_MS)
  }

  return results
}
