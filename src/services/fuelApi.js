import { CKAN_BASE_URL, getCurrentResourceId, FUEL_TYPE_IDS } from '../config/constants.js'

let cache = { data: null, timestamp: 0, fuelType: null, source: null }
const CACHE_DURATION_LIVE = 5 * 60 * 1000   // 5 minutes for live API
const CACHE_DURATION_CKAN = 30 * 60 * 1000  // 30 minutes for CKAN

const hasLiveToken = !!import.meta.env.VITE_FPQ_TOKEN

export function getDataSource() {
  return hasLiveToken ? 'live' : 'ckan'
}

export async function fetchFuelPrices(fuelType) {
  const source = getDataSource()
  const cacheDuration = source === 'live' ? CACHE_DURATION_LIVE : CACHE_DURATION_CKAN
  const now = Date.now()

  if (cache.data && cache.fuelType === fuelType && cache.source === source && now - cache.timestamp < cacheDuration) {
    return cache.data
  }

  const data = source === 'live'
    ? await fetchFromLiveApi(fuelType)
    : await fetchFromCkan(fuelType)

  cache = { data, timestamp: now, fuelType, source }
  return data
}

// --- Live FuelPricesQLD API ---

// Cache brand names separately (they rarely change)
let brandCache = null

async function fetchBrands() {
  if (brandCache) return brandCache
  const res = await fetch('/api/live/Subscriber/GetCountryBrands?countryId=21')
  if (!res.ok) return new Map()
  const data = await res.json()
  const map = new Map()
  // Response is { Brands: [{ BrandId, Name }] }
  for (const b of (data.Brands || [])) {
    map.set(b.BrandId, b.Name)
  }
  brandCache = map
  return map
}

async function fetchFromLiveApi(fuelType) {
  const [sitesRes, pricesRes, brandMap] = await Promise.all([
    fetch('/api/live/Subscriber/GetFullSiteDetails?countryId=21&geoRegionLevel=3&geoRegionId=1'),
    fetch('/api/live/Price/GetSitesPrices?countryId=21&geoRegionLevel=3&geoRegionId=1'),
    fetchBrands(),
  ])

  if (!sitesRes.ok || !pricesRes.ok) {
    throw new Error(`Live API error: sites=${sitesRes.status}, prices=${pricesRes.status}`)
  }

  const sitesData = await sitesRes.json()
  const pricesData = await pricesRes.json()

  const sites = sitesData.S || []
  const sitePrices = pricesData.SitePrices || []

  // Build a map of sites by ID
  const siteMap = new Map()
  for (const site of sites) {
    siteMap.set(site.S, site) // S = SiteId
  }

  // Get the fuel type ID for filtering
  const fuelId = FUEL_TYPE_IDS[fuelType]

  // Prices are flat: each entry is { SiteId, FuelId, Price, TransactionDateUtc }
  // Filter to our fuel type and build stations
  const stations = []
  for (const sp of sitePrices) {
    if (sp.FuelId !== fuelId) continue
    if (!sp.Price || sp.Price <= 0 || sp.Price >= 9990) continue

    const site = siteMap.get(sp.SiteId)
    if (!site || !site.Lat || !site.Lng) continue

    // Extract suburb from address or postcode area
    const brandName = brandMap.get(site.B) || ''
    // Try to get suburb from the site name (e.g. "7-Eleven Coomera" -> "Coomera")
    const nameParts = (site.N || '').split(' ')
    const possibleSuburb = nameParts.length > 1 ? nameParts.slice(-1)[0] : ''

    stations.push({
      SiteId: sp.SiteId,
      Site_Name: site.N || '',
      Site_Brand: brandName,
      Sites_Address_Line_1: site.A || '',
      Site_Suburb: possibleSuburb,
      Site_Post_Code: site.P || '',
      Site_Latitude: site.Lat,
      Site_Longitude: site.Lng,
      Fuel_Type: fuelType,
      Price: sp.Price, // tenths of cents (2299 = $2.299/L)
      TransactionDateutc: sp.TransactionDateUtc || new Date().toISOString(),
    })
  }

  return stations
}

// --- CKAN Fallback API ---

async function fetchFromCkan(fuelType) {
  const resourceId = getCurrentResourceId()
  const filters = JSON.stringify({ Fuel_Type: fuelType })
  const fields = [
    'SiteId', 'Site_Name', 'Site_Brand',
    'Sites_Address_Line_1', 'Site_Suburb', 'Site_Post_Code',
    'Site_Latitude', 'Site_Longitude',
    'Fuel_Type', 'Price', 'TransactionDateutc',
  ].join(',')

  const params = new URLSearchParams({
    resource_id: resourceId,
    filters,
    fields,
    limit: '32000',
    sort: 'TransactionDateutc desc',
  })

  const response = await fetch(`${CKAN_BASE_URL}?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch fuel prices: ${response.status}`)
  }

  const json = await response.json()
  if (!json.success) {
    throw new Error('CKAN API returned unsuccessful response')
  }

  return deduplicateLatestPrices(json.result.records)
}

// Price must be between $0.50/L (500) and $5.00/L (5000) in tenths of cents
const MIN_PRICE = 500
const MAX_PRICE = 5000

function isValidPrice(price) {
  return price && price >= MIN_PRICE && price <= MAX_PRICE
}

function deduplicateLatestPrices(records) {
  const latestByStation = new Map()

  for (const record of records) {
    if (!isValidPrice(record.Price)) continue
    const existing = latestByStation.get(record.SiteId)
    if (!existing || record.TransactionDateutc > existing.TransactionDateutc) {
      latestByStation.set(record.SiteId, record)
    }
  }

  return Array.from(latestByStation.values()).filter(
    (s) => s.Site_Latitude && s.Site_Longitude
  )
}

export function clearCache() {
  cache = { data: null, timestamp: 0, fuelType: null, source: null }
}
