import { createContext, useContext, useReducer, useEffect } from 'react'
import Papa from 'papaparse'

const AppDataContext = createContext(null)

const initialState = {
  contractRows: [],
  locationMap: new Map(),
  orgRows: [],
  loading: false,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_LOCATIONS': return { ...state, locationMap: action.payload }
    case 'SET_CONTRACT': return { ...state, contractRows: action.payload }
    case 'SET_ORG': return { ...state, orgRows: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false }
    default: return state
  }
}

async function parseCsv(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: (err) => reject(err),
    })
  })
}

export function AppDataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    async function loadData() {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const [locRows, orgRows, contractRows] = await Promise.all([
          parseCsv('/data/cpac_plant_locations.csv'),
          parseCsv('/data/plant_dataocean_202602271417.csv'),
          parseCsv('/data/contract_period_2026227.csv'),
        ])

        const locationMap = new Map()
        locRows.forEach((r) => {
          const key = (r.plant_no || r.plant_code || '').trim()
          if (key) {
            locationMap.set(key, {
              plant_name: r.plant_name,
              lat: parseFloat(r.latitude),
              lng: parseFloat(r.longitude),
            })
          }
        })

        dispatch({ type: 'SET_LOCATIONS', payload: locationMap })
        dispatch({ type: 'SET_ORG', payload: orgRows })
        dispatch({ type: 'SET_CONTRACT', payload: contractRows })
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: e.message })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    loadData()
  }, [])

  return (
    <AppDataContext.Provider value={{ state, dispatch }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  return useContext(AppDataContext)
}
