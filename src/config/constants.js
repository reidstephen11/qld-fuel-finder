export const CKAN_BASE_URL = 'https://www.data.qld.gov.au/api/action/datastore_search'
export const FPQ_BASE_URL = 'https://fppdirectapi-prod.fuelpricesqld.com.au'

export const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'

// QLD Fuel Price Reporting - monthly resource IDs
// Update these as new months are published at data.qld.gov.au
export const RESOURCE_IDS = {
  '2025-12': 'efba6a59-325b-44d5-8d73-06f5d10060f5',
  '2026-01': '61a27cfa-9ec5-47cc-8ce5-274f2dcb1908',
  '2026-02': 'f013457b-fd77-4cf0-91e7-28ef983d8c3c',
}

// Get the most recent resource ID available
export function getCurrentResourceId() {
  const keys = Object.keys(RESOURCE_IDS).sort().reverse()
  return RESOURCE_IDS[keys[0]]
}

export const FUEL_TYPES = [
  { key: 'Unleaded', label: 'Unleaded 91' },
  { key: 'e10', label: 'Ethanol E10' },
  { key: 'PULP 95/96 RON', label: 'Premium 95' },
  { key: 'PULP 98 RON', label: 'Premium 98' },
  { key: 'Diesel', label: 'Diesel' },
  { key: 'Premium Diesel', label: 'Premium Diesel' },
  { key: 'LPG', label: 'LPG' },
  { key: 'e85', label: 'E85' },
]

// Live API fuel type IDs (from FuelPricesQLD API)
export const FUEL_TYPE_IDS = {
  'Unleaded': 2,
  'e10': 5,
  'PULP 95/96 RON': 3,
  'PULP 98 RON': 4,
  'Diesel': 1,
  'Premium Diesel': 6,
  'LPG': 7,
  'e85': 8,
}

export const DEFAULT_SETTINGS = {
  tankSize: 50,
  currentFuelLevel: 25,
  consumptionRate: 10,
  searchRadius: 15,
}

export const DEFAULT_MAP_CENTER = [-27.4698, 153.0251] // Brisbane CBD
export const DEFAULT_MAP_ZOOM = 12

export const SEARCH_RADIUS_OPTIONS = [5, 10, 15, 25, 50]
