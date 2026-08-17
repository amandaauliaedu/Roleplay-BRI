import { motion } from 'framer-motion'
import { Landmark, Home, Table2, FileDown, BarChart3, Menu, X, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'live', label: 'Live Response', icon: Table2 },
  { id: 'report', label: 'Download Report', icon: FileDown },
  { id: 'analyst', label: 'Data Analyst', icon: BarChart3 },
]

export default function Navbar({ active, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleClick = (id) => {
    onNavigate(id)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Landmark size={19} strokeWidth={2} />
            <span className="absolute inset-0 rounded-lg border border-brand/40 animate-pulseRing" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold text-ink">BRI REGION 12 SURABAYA</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              Operation, Service, and E-Channel (OSE)
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-brand"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon size={15} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Ganti tema terang/gelap"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink-muted transition-colors hover:border-brand/50 hover:text-brand"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="text-ink md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Buka menu navigasi"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border px-4 py-3 md:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                  isActive ? 'bg-brand/10 text-brand' : 'text-ink-muted'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}
        </motion.div>
      )}
    </header>
  )
}
