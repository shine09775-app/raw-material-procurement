import { useState } from 'react'
import { AppDataProvider } from './context/AppDataContext'
import { FilterProvider } from './context/FilterContext'
import TopBar from './components/layout/TopBar'
import TabNav from './components/layout/TabNav'
import BenchmarkingPage from './pages/BenchmarkingPage'
import ContractSummaryPage from './pages/ContractSummaryPage'
import CapacityPage from './pages/CapacityPage'
import DataManagementPage from './pages/DataManagementPage'
import RMCSmartMapPage from './pages/RMCSmartMapPage'

const TABS = [
  { id: 'benchmarking', label: 'Benchmarking' },
  { id: 'contract', label: 'Contract Summary' },
  { id: 'capacity', label: 'Capacity & Feasibility' },
  { id: 'data', label: 'Data Management' },
  { id: 'map', label: 'RMC Smart Map' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('benchmarking')

  return (
    <AppDataProvider>
      <FilterProvider>
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
          <TopBar activeTab={activeTab} />
          <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 overflow-hidden">
            {activeTab === 'benchmarking' && <BenchmarkingPage />}
            {activeTab === 'contract' && <ContractSummaryPage />}
            {activeTab === 'capacity' && <CapacityPage />}
            {activeTab === 'data' && <DataManagementPage />}
            {activeTab === 'map' && <RMCSmartMapPage />}
          </main>
        </div>
      </FilterProvider>
    </AppDataProvider>
  )
}
