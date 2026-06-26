import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { useAppData } from '../context/AppDataContext'
import { clean } from '../utils/formatters'

const REQUIRED_COLS = ['plant_code', 'plant_name', 'material_code', 'material_name', 'contract_type', 'source_category', 'source_name', 'transporter_name', 'effective_date', 'end_date', 'distance_km', 'rawmat_price', 'transport_price_after_adjust', 'total_price']

export default function DataManagementPage() {
  const { dispatch } = useAppData()
  const fileRef = useRef()
  const [preview, setPreview] = useState(null)
  const [fileLabel, setFileLabel] = useState(null)
  const [errors, setErrors] = useState([])

  function validate(rows, cols) {
    const errs = []
    const missing = REQUIRED_COLS.filter((c) => !cols.includes(c))
    if (missing.length) errs.push({ type: 'error', msg: `ขาด columns: ${missing.join(', ')}` })
    else errs.push({ type: 'ok', msg: 'ครบทุก required columns' })

    const badDates = rows.filter((r) => r.effective_date && isNaN(new Date(r.effective_date)))
    if (badDates.length) errs.push({ type: 'warn', msg: `effective_date format ผิด ${badDates.length} แถว` })
    else errs.push({ type: 'ok', msg: 'effective_date format ถูกต้อง' })

    const badPrices = rows.filter((r) => r.total_price && isNaN(parseFloat(r.total_price)))
    if (badPrices.length) errs.push({ type: 'warn', msg: `total_price ไม่ใช่ตัวเลข ${badPrices.length} แถว` })
    else errs.push({ type: 'ok', msg: 'total_price format ถูกต้อง' })

    const cats = new Set(rows.map((r) => clean(r.source_category)))
    const validCats = new Set(['หลัก', 'สำรอง', ''])
    const badCats = [...cats].filter((c) => c && !validCats.has(c))
    if (badCats.length) errs.push({ type: 'warn', msg: `source_category ที่ไม่รู้จัก: ${badCats.join(', ')}` })
    else errs.push({ type: 'ok', msg: 'source_category ถูกต้อง (หลัก/สำรอง)' })

    return errs
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileLabel(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data
        const cols = result.meta.fields || []
        setPreview({ rows, cols })
        setErrors(validate(rows, cols))
        dispatch({ type: 'SET_CONTRACT', payload: rows })
      },
    })
  }

  function loadSample() {
    setFileLabel('sample_contract_upload.csv')
    Papa.parse('/data/contract_period_2026227.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setPreview({ rows: result.data, cols: result.meta.fields || [] })
        setErrors(validate(result.data, result.meta.fields || []))
      },
    })
  }

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      {/* Upload Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Upload CSV</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            เลือกไฟล์ CSV
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </label>
          <button onClick={loadSample} className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            ดู Sample Data
          </button>
          {fileLabel && <span className="text-sm text-gray-500">📄 {fileLabel}</span>}
        </div>
      </div>

      {/* Expected Columns */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Expected Columns</h2>
        <div className="flex flex-wrap gap-2">
          {REQUIRED_COLS.map((c) => (
            <span key={c} className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">{c}</span>
          ))}
        </div>
      </div>

      {/* Validation */}
      {errors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Validation Results</h2>
          <div className="space-y-1.5">
            {errors.map((e, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${e.type === 'error' ? 'text-red-600' : e.type === 'warn' ? 'text-yellow-600' : 'text-green-600'}`}>
                <span>{e.type === 'error' ? '✗' : e.type === 'warn' ? '⚠' : '✓'}</span>
                {e.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Table */}
      {preview && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Preview ({preview.rows.length.toLocaleString()} rows)</h2>
            <span className="text-xs text-gray-400">แสดง 8 แถวแรก</span>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  {preview.cols.map((c) => (
                    <th key={c} className={`px-3 py-2 text-left font-medium ${REQUIRED_COLS.includes(c) ? 'text-green-700' : 'text-gray-400'}`}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 8).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    {preview.cols.map((c) => (
                      <td key={c} className="px-3 py-1.5 text-gray-700 max-w-[160px] truncate">{row[c] ?? ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
