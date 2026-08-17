import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import { LoadingSpinner } from './components/LoadingState'
import Home from './sections/Home'
import LiveResponse from './sections/LiveResponse'
import DownloadReport from './sections/DownloadReport'
import DataAnalyst from './sections/DataAnalyst'
import { useSheetData } from './hooks/useSheetData'
import { buildReportMatrix } from './utils/dataProcessor'

export default function App() {
  const [activeSection, setActiveSection] = useState('home')
  const { rows: rawRows, status, lastSync, error, refresh } = useSheetData()

  // Matriks agregat (satu baris per unit master data) dipakai oleh Home & Data Analyst
  const matrixRows = useMemo(() => buildReportMatrix(rawRows), [rawRows])

  const isLoading = status === 'idle' || (status === 'loading' && rawRows.length === 0)

  return (
    <div className="min-h-screen bg-void">
      <Navbar active={activeSection} onNavigate={setActiveSection} />

      <main>
        {isLoading ? (
          <LoadingSpinner label="Menyinkronkan data roleplay..." />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {activeSection === 'home' && <Home matrixRows={matrixRows} onNavigate={setActiveSection} />}
              {activeSection === 'live' && (
                <LiveResponse rows={rawRows} status={status} lastSync={lastSync} error={error} onRefresh={refresh} />
              )}
              {activeSection === 'report' && <DownloadReport rows={rawRows} />}
              {activeSection === 'analyst' && <DataAnalyst matrixRows={matrixRows} rawRows={rawRows} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center">
        <p className="font-mono text-[11px] text-ink-faint">
          BRI Region 12 Surabaya · Operation, Service, and E-Channel (OSE) · Dibangun dengan React,
          Tailwind CSS &amp; Framer Motion
        </p>
      </footer>
    </div>
  )
}
