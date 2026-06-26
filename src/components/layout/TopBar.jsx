import { useAppData } from '../../context/AppDataContext'

export default function TopBar({ activeTab }) {
  const { state, dispatch } = useAppData()

  function handleRefresh() {
    dispatch({ type: 'SET_LOADING', payload: true })
    // Reload page to re-fetch CSV data
    window.location.reload()
  }

  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shadow-sm shrink-0">
      {/* Left: Logo + Brand */}
      <img src="/cpac-logo.jpg" alt="CPAC" className="h-8 w-8 rounded object-contain shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-bold text-gray-900 leading-tight">CPAC iSupply</div>
        <div className="text-xs text-gray-400 leading-tight hidden sm:block">Raw Material Procurement & Benchmarking</div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Loading indicator */}
      {state.loading && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <svg className="animate-spin h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="hidden sm:inline">กำลังโหลด...</span>
        </div>
      )}

      {/* Data source badge */}
      {!state.loading && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded hidden sm:inline ${state.contractRows.length ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {state.contractRows.length ? `${state.contractRows.length.toLocaleString()} rows` : 'no data'}
        </span>
      )}

      {/* Export CSV */}
      {activeTab === 'benchmarking' && (
        <button
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hidden sm:flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      )}

      {/* Refresh */}
      <button onClick={handleRefresh}
        className="border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </header>
  )
}
