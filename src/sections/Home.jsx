import { motion } from 'framer-motion'
import { ShieldCheck, Building2, Gauge, ClipboardList, ArrowUpRight, Radar } from 'lucide-react'
import StatCard from '../components/StatCard'
import { computeSummary } from '../utils/dataProcessor'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function Home({ matrixRows, onNavigate }) {
  const summary = computeSummary(matrixRows)

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-grid-lines bg-grid opacity-[0.04]" />

        {/* Elemen mengambang */}
        <motion.div
          className="pointer-events-none absolute -right-10 top-20 hidden h-64 w-64 rounded-full border border-brand/10 md:block"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
        >
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-brand shadow-glow" />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute -right-2 top-32 hidden h-40 w-40 rounded-full border border-teal/10 md:block"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
        />

        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl">
            <motion.span variants={fadeUp} className="eyebrow inline-flex items-center gap-2">
              <Radar size={13} className="animate-pulse" />
              OPERATION, SERVICE, AND E-CHANNEL (OSE)
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-5 font-display text-4xl font-semibold leading-[1.1] text-ink md:text-6xl"
            >
              Kepatuhan roleplay,{' '}
              <span className="relative inline-block text-brand">
                terpantau real-time
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="8"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                >
                  <path d="M0 4 Q 50 0, 100 4 T 200 4" stroke="#00529C" strokeWidth="2" fill="none" opacity="0.5" />
                </svg>
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
              Satu ruang kendali untuk memantau respons, menganalisis performa, dan mengekspor
              laporan final roleplay seluruh KC Induk &amp; UKO di bawah BRI Region 12 Surabaya —
              lengkap dengan audit trail dan visualisasi kepatuhan per parameter.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onNavigate('live')} className="btn-primary">
                Lihat Live Response
                <ArrowUpRight size={16} />
              </button>
              <button onClick={() => onNavigate('report')} className="btn-ghost">
                Unduh Report Final
              </button>
              <button onClick={() => onNavigate('analyst')} className="btn-ghost">
                Buka Data Analyst
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Ringkasan Cepat</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Status Roleplay Terkini</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={ClipboardList}
            label="Total Evaluasi"
            value={summary.totalEvaluasi}
            accent="brand"
            delay={0}
          />
          <StatCard
            icon={Building2}
            label="KC Induk Aktif"
            value={summary.kcActive}
            accent="teal"
            delay={0.05}
          />
          <StatCard
            icon={Gauge}
            label="Skor Kepatuhan Rata-Rata"
            value={summary.avgScore}
            suffix="%"
            accent="pass"
            delay={0.1}
          />
          <StatCard
            icon={ShieldCheck}
            label="Tingkat Kelulusan"
            value={summary.passRate}
            suffix="%"
            accent="warn"
            delay={0.15}
          />
        </div>
      </section>

      {/* Quick link cards */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NavCard
            title="Live Response Monitoring"
            desc="Pantau data mentah respons roleplay secara langsung dengan filter instan."
            onClick={() => onNavigate('live')}
            delay={0}
          />
          <NavCard
            title="Download Report Final"
            desc="Filter berdasarkan periode & unit, lalu ekspor matriks laporan ke Excel atau PDF."
            onClick={() => onNavigate('report')}
            delay={0.1}
          />
          <NavCard
            title="Data Analyst"
            desc="Telusuri tren, distribusi peran, dan unit yang membutuhkan peningkatan."
            onClick={() => onNavigate('analyst')}
            delay={0.2}
          />
        </div>
      </section>
    </div>
  )
}

function NavCard({ title, desc, onClick, delay }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="panel group flex flex-col items-start gap-3 p-6 text-left transition-colors hover:border-brand/40"
    >
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-muted">{desc}</p>
      <span className="mt-auto flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
        Buka <ArrowUpRight size={14} />
      </span>
    </motion.button>
  )
}
