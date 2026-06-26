import { createContext, useContext, useReducer, useMemo } from 'react'
import { useAppData } from './AppDataContext'
import { clean } from '../utils/formatters'

const FilterContext = createContext(null)

const today = new Date()
const y = today.getFullYear()

const DEFAULT_FILTERS = {
  company: 'all',
  bu: 'all',
  region: 'all',
  focusPlantCode: '',
  matStone: true,
  matSand: true,
  materialCodes: [],
  contractModel: 'all',
  priceBasis: 'total',
  dateFrom: '',
  dateTo: '',
  radiusKm: 50,
  gapOnly: false,
  gapThreshold: 3,
  heatmapSearch: '',
  heatmapSort: { field: 'gap_pct', direction: 'desc' },
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET': return { ...state, [action.key]: action.value }
    case 'SET_MANY': return { ...state, ...action.payload }
    case 'RESET': return { ...DEFAULT_FILTERS }
    case 'SET_DATE_PRESET': {
      const now = new Date()
      const y = now.getFullYear()
      const m = now.getMonth()
      const q = Math.floor(m / 3)
      if (action.preset === 'month') return { ...state, dateFrom: `${y}-${String(m + 1).padStart(2, '0')}-01`, dateTo: new Date(y, m + 1, 0).toISOString().slice(0, 10) }
      if (action.preset === 'quarter') return { ...state, dateFrom: `${y}-${String(q * 3 + 1).padStart(2, '0')}-01`, dateTo: new Date(y, q * 3 + 3, 0).toISOString().slice(0, 10) }
      if (action.preset === '2026') return { ...state, dateFrom: '2026-01-01', dateTo: '2026-12-31' }
      return { ...state, dateFrom: '', dateTo: '' }
    }
    case 'TOGGLE_SORT': {
      const { field } = action
      const current = state.heatmapSort
      return { ...state, heatmapSort: { field, direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc' } }
    }
    default: return state
  }
}

export function FilterProvider({ children }) {
  const [filters, dispatch] = useReducer(reducer, DEFAULT_FILTERS)
  const { state: dataState } = useAppData()
  const { orgRows, locationMap, contractRows } = dataState

  // Pre-build set of plant codes that have contract data
  const contractPlantCodes = useMemo(() => new Set(contractRows.map((r) => (r.plant_code || '').trim())), [contractRows])

  // Derive cascading options from org data
  const orgOptions = useMemo(() => {
    const companies = ['all', ...new Set(orgRows.map((r) => clean(r.PLANT_TYPE)).filter(Boolean))]
    const buMap = new Map()
    const regionMap = new Map()
    const plantMap = new Map()

    orgRows.forEach((r) => {
      const co = clean(r.PLANT_TYPE)
      const bu = clean(r.DIVISION_NAME)
      const reg = clean(r.DEPARTMENT_NAME)
      const pCode = clean(r.PLANT_NO)
      const pName = clean(r.PLANT_NAME)

      if (!buMap.has(co)) buMap.set(co, new Set())
      buMap.get(co).add(bu)

      const buKey = `${co}||${bu}`
      if (!regionMap.has(buKey)) regionMap.set(buKey, new Set())
      regionMap.get(buKey).add(reg)

      const regKey = `${buKey}||${reg}`
      if (!plantMap.has(regKey)) plantMap.set(regKey, new Map())
      if (pCode) plantMap.get(regKey).set(pCode, pName)
    })

    return { companies, buMap, regionMap, plantMap }
  }, [orgRows])

  const buOptions = useMemo(() => {
    if (filters.company === 'all') {
      const all = new Set()
      orgOptions.buMap.forEach((buSet) => buSet.forEach((b) => all.add(b)))
      return ['all', ...[...all].sort()]
    }
    return ['all', ...([...(orgOptions.buMap.get(filters.company) || [])].sort())]
  }, [filters.company, orgOptions])

  const regionOptions = useMemo(() => {
    const all = new Set()
    orgOptions.regionMap.forEach((regSet, key) => {
      const [co, bu] = key.split('||')
      if (filters.company !== 'all' && co !== filters.company) return
      if (filters.bu !== 'all' && bu !== filters.bu) return
      regSet.forEach((r) => all.add(r))
    })
    return ['all', ...[...all].sort()]
  }, [filters.company, filters.bu, orgOptions])

  const plantOptions = useMemo(() => {
    const result = new Map()
    orgOptions.plantMap.forEach((plants, key) => {
      const [co, bu, reg] = key.split('||')
      if (filters.company !== 'all' && co !== filters.company) return
      if (filters.bu !== 'all' && bu !== filters.bu) return
      if (filters.region !== 'all' && reg !== filters.region) return
      plants.forEach((name, code) => result.set(code, name))
    })
    // Only include plants that have both location data AND contract data
    const filtered = [...result.entries()]
      .filter(([code]) => locationMap && locationMap.has(code) && contractPlantCodes.has(code))
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'))
    // Fallback: if no plants match (data not loaded yet), return unfiltered
    return filtered.length ? filtered : [...result.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, 'th'))
  }, [filters.company, filters.bu, filters.region, orgOptions, locationMap, contractPlantCodes])

  // Auto-pick first plant if current plant not in list
  const focusPlantCode = useMemo(() => {
    if (!plantOptions.length) return filters.focusPlantCode
    if (plantOptions.some((p) => p.code === filters.focusPlantCode)) return filters.focusPlantCode
    return plantOptions[0]?.code || ''
  }, [plantOptions, filters.focusPlantCode])

  const focusPlantLabel = useMemo(() => {
    const p = plantOptions.find((p) => p.code === focusPlantCode)
    return p ? `${p.code} ${p.name}` : focusPlantCode
  }, [focusPlantCode, plantOptions])

  const effectiveFilters = useMemo(() => ({
    ...filters,
    focusPlantCode,
    focusPlantLabel,
    compareField: filters.priceBasis === 'transport' ? 'transport_cost' : filters.priceBasis === 'source' ? 'source_cost' : 'total_cost',
    compareLabel: filters.priceBasis === 'transport' ? 'ค่าขนส่ง' : filters.priceBasis === 'source' ? 'ค่าวัตถุดิบ' : 'ราคารวม',
  }), [filters, focusPlantCode, focusPlantLabel])

  return (
    <FilterContext.Provider value={{ filters: effectiveFilters, dispatch, buOptions, regionOptions, plantOptions }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  return useContext(FilterContext)
}
