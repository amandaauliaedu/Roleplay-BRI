import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RadarArea,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { BarChart3, TrendingUp, PieChart as PieIcon, Radar as RadarIcon, AlertTriangle } from 'lucide-react'
import StatCard from '../components/StatCard'
import {
  computeSummary,
  aggregateByKcInduk,
  aggregateTrend,
  aggregateRoleDistribution,
  aggregateRadarByKc,
  lowestPerformingUnits,
} from '../utils/dataProcessor'

const COLORS = ['#00529C', '#0EA5A5', '#22C55E', '#F59E0B', '#EF4444', '#818CF8', '#F472B6']

const tooltipStyle = {
  backgroundColor: '#0B1F4D',
  border: '1px solid #24406B',
  borderRadius: 10,
  fontSize: 12,
  color: '#E7ECF3',
}

export default function DataAnalyst({ matrixRows, rawRows }) {
  const [kcInduk, setKcInduk] = useState('Semua')
  const [radarKc, setRadarKc] = useState('Semua')

  const kcOptions = useMemo(() => [...new Set(matrixRows.map((r) => r.kcInduk))].sort(), [matrixRows])
  const scoped = useMemo(
    () => (kcInduk === 'Semua' ? matrixRows : matrixRows.filter((r) => r.kcInduk === kcInduk)),
    [matrixRows, kcInduk],
  )
  const scopedRaw = useMemo(
    () => (kcInduk === 'Semua' ? rawRows : rawRows.filter((r) => r.kcInduk === kcInduk)),
    [rawRows, kcInduk],
  )

  const summary = computeSummary(scoped)
  const byKc = useMemo(() => aggregateByKcInduk(scoped), [scoped])
  const trend = useMemo(() => aggregateTrend(scopedRaw), [scopedRaw])
  const roleDist = useMemo(() => aggregateRoleDistribution(scoped), [scoped])
  const radarData = useMemo(() => aggregateRadarByKc(scoped, radarKc), [scoped, radarKc])
  const weakest = useMemo(() => lowestPerformingUnits(scoped, 5), [scoped])

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="eyebrow flex items-center gap-2">
          <BarChart3 size={13} />
          Section 4
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Data Analyst &amp; Interactive Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Visualisasi mendalam lintas KC Induk BRI Region 12 Surabaya untuk mengidentifikasi tren
          kepatuhan dan unit yang membutuhkan pendampingan lanjutan.
        </p>
      </motion.div>

      <div className="mt-4 flex items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">KC Induk</span>
        <select
          value={kcInduk}
          onChange={(e) => {
            setKcInduk(e.target.value)
            setRadarKc('Semua')
          }}
          className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm text-ink focus:border-brand/50 focus:outline-none"
        >
          <option value="Semua">Semua KC Induk</option>
          {kcOptions.map((kc) => (
            <option key={kc} value={kc}>
              {kc}
            </option>
          ))}
        </select>
      </div>

      {/* KPI cards */}
      <div className="mb-10 mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BarChart3} label="Penyelesaian Roleplay" value={summary.totalEvaluasi} accent="brand" delay={0} />
        <StatCard icon={TrendingUp} label="Skor Kelulusan" value={summary.passRate} suffix="%" accent="pass" delay={0.05} />
        <StatCard icon={PieIcon} label="Skor Rata-Rata" value={summary.avgScore} suffix="%" accent="teal" delay={0.1} />
        <StatCard icon={RadarIcon} label="KC Induk Terpantau" value={summary.kcActive} accent="warn" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <ChartPanel title="Kinerja per KC Induk" subtitle="Skor kepatuhan rata-rata (%)" delay={0}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byKc} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="kcInduk" tick={{ fontSize: 10, fill: '#8593AB' }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: '#8593AB' }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,82,156,0.06)' }} />
              <Bar dataKey="skorRataRata" name="Skor Rata-Rata" fill="#00529C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Line chart */}
        <ChartPanel title="Tren Berkala" subtitle="Jumlah submisi roleplay mingguan" delay={0.08}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="minggu" tick={{ fontSize: 10, fill: '#8593AB' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8593AB' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="jumlahSubmisi" name="Jumlah Submisi" stroke="#0EA5A5" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Pie chart */}
        <ChartPanel title="Distribusi Pemenuhan Peran" subtitle="Jumlah unit dengan status Lengkap" delay={0.16}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={roleDist} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {roleDist.map((entry, idx) => (
                  <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} stroke="#0B1F4D" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8593AB' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Radar chart */}
        <ChartPanel
          title="Radar Parameter"
          subtitle="Identifikasi parameter lemah per KC Induk"
          delay={0.24}
          headerRight={
            <select
              value={radarKc}
              onChange={(e) => setRadarKc(e.target.value)}
              className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-xs text-ink focus:border-brand/50 focus:outline-none"
            >
              <option value="Semua">Semua KC Induk</option>
              {kcOptions.map((kc) => (
                <option key={kc} value={kc}>
                  {kc}
                </option>
              ))}
            </select>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#94A3B8" strokeOpacity={0.3} />
              <PolarAngleAxis dataKey="parameter" tick={{ fontSize: 10, fill: '#8593AB' }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#586279' }} domain={[0, 100]} />
              <RadarArea name="Skor" dataKey="skor" stroke="#00529C" fill="#00529C" fillOpacity={0.25} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Weakest units table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="panel mt-6 p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-fail" />
          <h3 className="font-display text-lg font-semibold text-ink">Unit yang Membutuhkan Peningkatan</h3>
        </div>
        <div className="space-y-2">
          {weakest.map((unit, i) => (
            <div
              key={unit.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface-raised p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink-faint">#{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-ink">{unit.namaUko}</p>
                  <p className="font-mono text-[11px] text-ink-faint">
                    {unit.branchCode} · {unit.kcInduk}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-fail" style={{ width: `${unit.score}%` }} />
                </div>
                <span className="font-mono text-xs text-fail">{unit.score}%</span>
              </div>
            </div>
          ))}
          {weakest.length === 0 && (
            <p className="py-6 text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
              Tidak ada data
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function ChartPanel({ title, subtitle, children, delay = 0, headerRight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="panel p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
          <p className="font-mono text-[11px] text-ink-faint">{subtitle}</p>
        </div>
        {headerRight}
      </div>
      {children}
    </motion.div>
  )
}
