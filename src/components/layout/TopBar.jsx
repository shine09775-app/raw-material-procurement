import { useAppData } from '../../context/AppDataContext'
import cpacLogo from '../../../cpac-logo.jpg'

const TITLE_MAP = {
  benchmarking: 'Benchmarking Dashboard',
  contract: 'Contract Summary',
  capacity: 'Capacity & Feasibility',
  data: 'Data Management',
  map: 'RMC Smart Map',
}

export default function TopBar({ activeTab }) {
  const { state } = useAppData()

  function handleRefresh() {
    window.location.reload()
  }

  return (
    <header className="topbar shadow-card">
      <div className="left">
        <div className="brand">
          <div className="logo overflow-hidden rounded-xl bg-white">
            <img src={cpacLogo} alt="CPAC" className="h-full w-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className="name">
              CPAC <span>iSupply</span>
            </div>
            <div className="hidden text-xs text-muted sm:block">
              {TITLE_MAP[activeTab] || 'Raw Material Procurement & Benchmarking'}
            </div>
          </div>
        </div>
      </div>

      <div className="right">
        <div className="hidden items-end sm:flex sm:flex-col">
          <div className="username">{state.loading ? 'Loading data...' : 'CPAC Live View'}</div>
          <div className="fullname">
            {state.contractRows.length ? `${state.contractRows.length.toLocaleString()} records loaded` : 'No data loaded'}
          </div>
        </div>
        <button className="icon-btn" onClick={handleRefresh} title="Refresh data" type="button">
          <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </header>
  )
}
