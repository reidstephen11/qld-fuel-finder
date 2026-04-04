function toRad(deg) {
  return (deg * Math.PI) / 180
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function calculateValueScore(station, userLat, userLon, settings) {
  const { tankSize, currentFuelLevel, consumptionRate } = settings
  const litresNeeded = tankSize * (1 - currentFuelLevel / 100)
  const pricePerLitreCents = station.Price / 10 // tenths of cent -> cents

  const distanceKm = station.drivingDistanceKm ??
    haversineDistance(userLat, userLon, station.Site_Latitude, station.Site_Longitude)

  const roundTripKm = distanceKm * 2
  const travelFuelLitres = roundTripKm * (consumptionRate / 100)
  const travelCostCents = travelFuelLitres * pricePerLitreCents

  const fillCostCents = litresNeeded * pricePerLitreCents
  const totalCostCents = fillCostCents + travelCostCents
  const effectivePriceCents = litresNeeded > 0 ? totalCostCents / litresNeeded : pricePerLitreCents

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    pricePerLitre: Math.round(pricePerLitreCents * 10) / 10,
    effectivePricePerLitre: Math.round(effectivePriceCents * 10) / 10,
    totalCostDollars: Math.round(totalCostCents) / 100,
    travelCostDollars: Math.round(travelCostCents) / 100,
    fillCostDollars: Math.round(fillCostCents) / 100,
  }
}

export function rankStations(stations, userLat, userLon, settings, searchRadius) {
  const scored = stations
    .map((station) => {
      const score = calculateValueScore(station, userLat, userLon, settings)
      return { ...station, score }
    })
    .filter((s) => s.score.distanceKm <= searchRadius)
    .sort((a, b) => a.score.effectivePricePerLitre - b.score.effectivePricePerLitre)

  // Assign color categories
  const total = scored.length
  return scored.map((station, index) => {
    let colorCategory = 'yellow'
    if (total > 0) {
      const percentile = index / total
      if (percentile < 0.2) colorCategory = 'green'
      else if (percentile > 0.8) colorCategory = 'red'
    }
    return { ...station, colorCategory }
  })
}

export function formatPrice(priceTenthsCents) {
  const dollars = priceTenthsCents / 1000
  return `$${dollars.toFixed(3)}`
}

export function formatPriceCents(priceTenthsCents) {
  const cents = priceTenthsCents / 10
  return `${cents.toFixed(1)}c`
}
