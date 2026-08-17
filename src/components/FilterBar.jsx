import { Search, Calendar, ChevronDown } from 'lucide-react'

export default function FilterBar({ filters, onChange, jenisUkoOptions, kcOptions, ukoOptions, branchOptions, showSearch = true }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="panel flex flex-col gap-3 p-4 md:flex-row md:flex-wrap md:items-center">
      {showSearch && (
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Cari KC Induk, UKO, Branch Code, Jabatan, atau Nama FL..."
            value={filters.search || ''}
            onChange={(e) => set('search', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none"
          />
        </div>
      )}

      {jenisUkoOptions && (
        <Select
          label="Jenis UKO"
          value={filters.jenisUko || 'Semua'}
          options={['Semua', ...jenisUkoOptions]}
          onChange={(v) => set('jenisUko', v)}
        />
      )}
      <Select
        label="KC Induk"
        value={filters.kcInduk || 'Semua'}
        options={['Semua', ...kcOptions]}
        onChange={(v) => set('kcInduk', v)}
      />
      <Select
        label="Nama UKO"
        value={filters.namaUko || 'Semua'}
        options={['Semua', ...ukoOptions]}
        onChange={(v) => set('namaUko', v)}
      />
      {branchOptions && (
        <Select
          label="Branch Code"
          value={filters.branchCode || 'Semua'}
          options={['Semua', ...branchOptions]}
          onChange={(v) => set('branchCode', v)}
        />
      )}

      <div className="flex items-center gap-2">
        <div className="relative">
          <Calendar size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => set('dateFrom', e.target.value)}
            className="rounded-lg border border-border bg-surface-raised py-2 pl-8 pr-2 text-xs text-ink focus:border-brand/50 focus:outline-none"
          />
        </div>
        <span className="text-xs text-ink-faint">s/d</span>
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => set('dateTo', e.target.value)}
          className="rounded-lg border border-border bg-surface-raised py-2 px-2 text-xs text-ink focus:border-brand/50 focus:outline-none"
        />
      </div>
    </div>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-border bg-surface-raised py-2 pl-3 pr-8 text-sm text-ink focus:border-brand/50 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'Semua' ? `${label}: Semua` : opt}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
    </div>
  )
}
