export default function TopBar() {
  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
      <img src="/cpac-logo.jpg" alt="CPAC" className="h-8 w-8 rounded object-contain" />
      <div>
        <div className="text-sm font-bold text-gray-900 leading-tight">CPAC iSupply</div>
        <div className="text-xs text-gray-500 leading-tight">Raw Material Procurement & Benchmarking</div>
      </div>
    </header>
  )
}
