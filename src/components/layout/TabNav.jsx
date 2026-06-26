export default function TabNav({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="flex bg-white border-b border-gray-200 overflow-x-auto shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={[
            'px-5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
            activeTab === tab.id
              ? 'border-red-700 text-red-700 bg-red-50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
