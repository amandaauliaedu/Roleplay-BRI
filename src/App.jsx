import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import { LoadingSpinner } from './components/LoadingState'
import Home from './sections/Home'
import LiveResponse from './sections/LiveResponse'
import DownloadReport from './sections/DownloadReport'
import DataAnalyst from './sections/DataAnalyst'
import { useSheetData } from './hooks/useSheetData'
import { buildReportRows } from './utils/dataProcessor'

export default function App() {
  const [activeSection, setActiveSection] = useState('home')
  const { rows: liveRows, status, lastSync, error, refresh } = useSheetData()

  const reportRows = useMemo(() => buildReportRows(liveRows), [liveRows])

  const isLoading = status === 'idle' || (status === 'loading' && liveRows.length === 0)

  return (
    <div className="min-h-screen bg-void">
      <Navbar active={activeSection} onNavigate={setActiveSection} status={status} />

      <main>
        {isLoading ? (
          <LoadingSpinner label="Menyinkronkan data roleplay dari Google Sheet..." />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {activeSection === 'home' && (
                <Home reportRows={reportRows} liveRows={liveRows} onNavigate={setActiveSection} />
              )}
              {activeSection === 'live' && (
                <LiveResponse
                  rows={liveRows}
                  status={status}
                  lastSync={lastSync}
                  error={error}
                  onRefresh={refresh}
                />
              )}
              {activeSection === 'report' && <DownloadReport liveRows={liveRows} />}
              {activeSection === 'analyst' && <DataAnalyst reportRows={reportRows} liveRows={liveRows} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center">
        <p className="font-mono text-[11px] text-ink-faint">
          Roleplay RO Surabaya · Operation, Service, and E-Channel (OSE) · Dibangun dengan React,
          Tailwind CSS &amp; Framer Motion
        </p>
      </footer>
    </div>
  )
}
