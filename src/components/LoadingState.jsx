import { motion } from 'framer-motion'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

export function LoadingSpinner({ label = 'Memuat data...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="text-brand"
      >
        <RefreshCw size={22} />
      </motion.span>
      <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">{label}</p>
    </div>
  )
}

export function SyncStatus({ status, lastSync, onRefresh }) {
  const isLive = status === 'live'
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2">
      <span className={`flex items-center gap-1.5 font-mono text-[11px] ${isLive ? 'text-pass' : 'text-warn'}`}>
        {isLive ? <Wifi size={12} /> : <WifiOff size={12} />}
        {isLive ? 'LIVE' : status === 'mock' ? 'MODE DEMO' : 'MENYAMBUNGKAN'}
      </span>
      {lastSync && (
        <span className="font-mono text-[11px] text-ink-faint">
          Sinkron: {lastSync.toLocaleTimeString('id-ID')}
        </span>
      )}
      <button
        onClick={onRefresh}
        className="ml-1 rounded-md p-1 text-ink-faint transition-colors hover:bg-surface-hover hover:text-brand"
        aria-label="Segarkan data"
      >
        <RefreshCw size={12} />
      </button>
    </div>
  )
}
