export default function KPICard({ label, value, sub, accent }) {
  return (
    <div
      className={`card flex h-full flex-col gap-1 px-4 py-4 ${
        accent ? 'border-[color:var(--brand)] bg-[linear-gradient(180deg,rgba(225,29,46,0.05),rgba(255,255,255,1))]' : ''
      }`}
    >
      <div className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-3)]">{label}</div>
      <div className={`truncate text-2xl font-black leading-tight ${accent ? 'text-brand' : 'text-[var(--text)]'}`}>{value ?? '—'}</div>
      {sub && <div className="text-sm leading-snug text-[var(--text-3)]">{sub}</div>}
    </div>
  )
}
