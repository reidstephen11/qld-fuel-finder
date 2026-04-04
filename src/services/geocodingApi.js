import { NOMINATIM_URL } from '../config/constants.js'

export async function geocodeLocation(query) {
  const params = new URLSearchParams({
    q: query,
    countrycodes: 'au',
    format: 'json',
    limit: '5',
    addressdetails: '1',
  })

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': 'QLD-Fuel-Finder-App/1.0' },
  })

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`)
  }

  const results = await response.json()

  return results
    .filter((r) => r.address?.state === 'Queensland')
    .map((r) => ({
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      suburb: r.address?.suburb || r.address?.city || r.address?.town || '',
      postcode: r.address?.postcode || '',
    }))
}
