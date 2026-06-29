import { useState } from 'react'
import { useFilters } from '../../context/FilterContext'
import { useAppData } from '../../context/AppDataContext'
import { clean, materialTypeOf } from '../../utils/formatters'

const RADIUS_STEPS = [10, 30, 50, 80, 120]
const DATE_PRESETS = [
  { id: 'month', label: 'à¹€à¸”à¸·à¸­à¸™à¸™à¸µà¹‰' },
  { id: 'quarter', label: 'à¹„à¸•à¸£à¸¡à¸²à¸ªà¸™à¸µà¹‰' },
  { id: '2026', label: 'à¸›à¸µ 2026' },
  { id: 'clear', label: 'à¸¥à¹‰à¸²à¸‡à¸§à¸±à¸™à¸—à¸µà¹ˆ' },
]

function Field({ label, children }) {
  return (
    <div className="field">
      <label className="label uppercase tracking-[0.16em]">{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select className="select text-sm" onChange={(e) => onChange(e.target.value)} value={value}>
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

export default function FilterBar({ onSearch, onReset }) {
  const { filters, dispatch, buOptions, regionOptions, plantOptions } = useFilters()
  const { state: dataState } = useAppData()
  const [collapsed, setCollapsed] = useState(false)
  const [matOpen, setMatOpen] = useState(false)

  const materialOptions = (() => {
    const allowedTypes = new Set()
    if (filters.matStone) allowedTypes.add('rock')
    if (filters.matSand) allowedTypes.add('sand')
    const map = new Map()
    dataState.contractRows.forEach((row) => {
      const code = clean(row.material_code)
      const name = clean(row.material_name)
      if (!code || !name) return
      const type = materialTypeOf(name, code)
      if (!allowedTypes.has(type)) return
      if (!map.has(code)) map.set(code, name)
    })
    return [...map.entries()]
      .map(([code, name]) => ({ code, label: `${code} â€“ ${name}` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'th'))
  })()

  const allMatCodes = materialOptions.map((option) => option.code)
  const allSelected = filters.materialCodes.length === 0 || filters.materialCodes.length === allMatCodes.length

  function toggleMat(code) {
    const current = filters.materialCodes
    const next = current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    dispatch({ type: 'SET', key: 'materialCodes', value: next })
  }

  return (
    <div className="card sticky top-0 z-20 overflow-visible">
      <div className="card-header">
        <div>
          <div className="card-title text-base">Filter Bar</div>
          <div className="card-subtitle">Radius benchmark + contract feasibility filters</div>
        </div>
        <button className="icon-pill text-xs font-black text-[var(--text-3)]" onClick={() => setCollapsed((value) => !value)} type="button">
          {collapsed ? 'â–¾' : 'â–´'}
        </button>
      </div>

      {!collapsed && (
        <div className="card-body">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Company">
              <Select
                onChange={(value) => dispatch({ type: 'SET', key: 'company', value })}
                options={[{ value: 'all', label: 'All' }, { value: 'CPAC', label: 'CPAC' }, { value: 'QMIX', label: 'QMIX' }]}
                value={filters.company}
              />
            </Field>

            <Field label="Business Unit">
              <Select
                onChange={(value) => dispatch({ type: 'SET', key: 'bu', value })}
                options={buOptions.map((option) => ({ value: option, label: option === 'all' ? 'All' : option }))}
                value={filters.bu}
              />
            </Field>

            <Field label="à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸´à¸•">
              <Select
                onChange={(value) => dispatch({ type: 'SET', key: 'region', value })}
                options={regionOptions.map((option) => ({ value: option, label: option === 'all' ? 'All' : option }))}
                value={filters.region}
              />
            </Field>

            <Field label="Plant">
              <select
                className="select text-sm"
                onChange={(e) => dispatch({ type: 'SET', key: 'focusPlantCode', value: e.target.value })}
                value={filters.focusPlantCode}
              >
                {plantOptions.map((plant) => (
                  <option key={plant.code} value={plant.code}>{plant.code} {plant.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Material Type">
              <div className="flex items-center gap-4 py-2 text-sm text-[var(--text-2)]">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={filters.matStone}
                    className="accent-red-600"
                    onChange={(e) => dispatch({ type: 'SET', key: 'matStone', value: e.target.checked })}
                    type="checkbox"
                  />
                  à¸«à¸´à¸™ (Rock)
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={filters.matSand}
                    className="accent-red-600"
                    onChange={(e) => dispatch({ type: 'SET', key: 'matSand', value: e.target.checked })}
                    type="checkbox"
                  />
                  à¸—à¸£à¸²à¸¢ (Sand)
                </label>
              </div>
            </Field>

            <Field label="Material Spec">
              <div className="relative">
                <button className="input flex items-center justify-between text-left text-sm" onClick={() => setMatOpen((value) => !value)} type="button">
                  <span className="truncate text-[var(--text-2)]">
                    {allSelected ? 'All' : `à¹€à¸¥à¸·à¸­à¸ ${filters.materialCodes.length} à¸£à¸²à¸¢à¸à¸²à¸£`}
                  </span>
                  <span className="ml-2 text-[var(--text-3)]">â–¾</span>
                </button>
                {matOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-auto rounded-[var(--r-lg)] border border-[color:var(--border)] bg-white shadow-[var(--shadow)]">
                    <label className="flex cursor-pointer items-center gap-2 border-b border-[color:var(--border)] px-3 py-2 text-sm hover:bg-[#f9fafb]">
                      <input
                        checked={allSelected}
                        className="accent-red-600"
                        onChange={() => dispatch({ type: 'SET', key: 'materialCodes', value: [] })}
                        type="checkbox"
                      />
                      <span className="font-medium">All</span>
                    </label>
                    {materialOptions.map((option) => (
                      <label key={option.code} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-[#f9fafb]">
                        <input
                          checked={filters.materialCodes.includes(option.code)}
                          className="accent-red-600"
                          onChange={() => toggleMat(option.code)}
                          type="checkbox"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Contract Model">
              <Select
                onChange={(value) => dispatch({ type: 'SET', key: 'contractModel', value })}
                options={[{ value: 'all', label: 'All' }, { value: 'type1', label: 'Type 1' }, { value: 'type2', label: 'Type 2' }]}
                value={filters.contractModel}
              />
            </Field>

            <Field label="Price Basis">
              <Select
                onChange={(value) => dispatch({ type: 'SET', key: 'priceBasis', value })}
                options={[{ value: 'total', label: 'Total' }, { value: 'transport', label: 'Transport' }, { value: 'source', label: 'Source' }]}
                value={filters.priceBasis}
              />
            </Field>

            <div className="xl:col-span-4">
              <div className="label mb-1.5 uppercase tracking-[0.16em]">Date Presets</div>
              <div className="flex flex-wrap gap-2">
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className="chip transition-colors hover:border-[color:var(--brand)] hover:bg-[rgba(225,29,46,0.08)] hover:text-[var(--brand)]"
                    onClick={() => dispatch({ type: 'SET_DATE_PRESET', preset: preset.id })}
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Date From">
              <input
                className="input text-sm"
                onChange={(e) => dispatch({ type: 'SET', key: 'dateFrom', value: e.target.value })}
                type="date"
                value={filters.dateFrom}
              />
            </Field>

            <Field label="Date To">
              <input
                className="input text-sm"
                onChange={(e) => dispatch({ type: 'SET', key: 'dateTo', value: e.target.value })}
                type="date"
                value={filters.dateTo}
              />
            </Field>

            <Field label={`Radius (km): ${filters.radiusKm}`}>
              <input
                className="w-full accent-red-600"
                max={RADIUS_STEPS.length - 1}
                min={0}
                onChange={(e) => dispatch({ type: 'SET', key: 'radiusKm', value: RADIUS_STEPS[+e.target.value] })}
                type="range"
                value={RADIUS_STEPS.indexOf(filters.radiusKm) === -1 ? 2 : RADIUS_STEPS.indexOf(filters.radiusKm)}
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                {RADIUS_STEPS.map((step) => <span key={step}>{step}</span>)}
              </div>
            </Field>

            <Field label="Gap Threshold">
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm">
                  <input
                    checked={filters.gapOnly}
                    className="accent-red-600"
                    onChange={(e) => dispatch({ type: 'SET', key: 'gapOnly', value: e.target.checked })}
                    type="checkbox"
                  />
                  only Gap &gt;
                </label>
                <input
                  className="input w-20 text-sm"
                  min={0}
                  onChange={(e) => dispatch({ type: 'SET', key: 'gapThreshold', value: +e.target.value })}
                  step={0.5}
                  type="number"
                  value={filters.gapThreshold}
                />
              </div>
            </Field>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-[color:var(--border)] pt-3">
            <button className="btn btn-primary text-sm" onClick={onSearch} type="button">
              Search
            </button>
            <button className="btn text-sm" onClick={onReset} type="button">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
