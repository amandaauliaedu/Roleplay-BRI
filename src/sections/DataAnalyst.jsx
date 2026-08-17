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
  LabelList,
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
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Radar as RadarIcon,
  AlertTriangle,
  Trophy,
  Lightbulb,
  Minus,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import { useTheme } from '../context/ThemeContext'
import {
  computeSummary,
  aggregateByKcInduk,
  aggregateTrend,
  aggregateRoleDistribution,
  aggregateRadarByKc,
  lowestPerformingUnits,
  bestPerformingUnits,
} from '../utils/dataProcessor'

const COLORS = ['#005BAB', '#2DD4BF', '#34D399', '#F59E0B', '#F87171', '#818CF8', '#F472B6']

function scoreColor(score) {
  if (score >= 85) return '#34D399'
  if (score >= 60) return '#F59E0B'
  return '#F87171'
}

export default function DataAnalyst({ reportRows, liveRows }) {
  const { theme } = useTheme()
  const [kcFocus, setKcFocus] = useState('Semua')

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: theme === 'dark' ? '#0D1628' : '#FFFFFF',
      border: `1px solid ${theme === 'dark' ? '#20304C' : '#D5E0F0'}`,
      borderRadius: 10,
      fontSize: 12,
      color: theme === 'dark' ? '#E7EEF8' : '#0D1E38',
    }),
    [theme],
  )
  const gridColor = theme === 'dark' ? '#20304C' : '#D5E0F0'
  const axisColor = theme === 'dark' ? '#8DA0BD' : '#52627E'

  const summary = useMemo(() => computeSummary(reportRows), [reportRows])
  const kcOptions = useMemo(() => [...new Set(reportRows.map((r) => r.kcInduk))].sort(), [reportRows])

  // KC Induk diurutkan dari skor TERBAIK -> TERENDAH (permintaan: ranking kinerja)
  const byKc = useMemo(() => [...aggregateByKcInduk(reportRows)].sort((a, b) => b.skorRataRata - a.skorRataRata), [reportRows])

  const trend = useMemo(() => aggregateTrend(liveRows), [liveRows])
  const roleDist = useMemo(() => aggregateRoleDistribution(reportRows), [reportRows])
  const radar = useMemo(() => aggregateRadarByKc(reportRows, kcFocus), [reportRows, kcFocus])
  const lowest = useMemo(() => lowestPerformingUnits(reportRows, 5), [reportRows])
  const best = useMemo(() => bestPerformingUnits(reportRows, 5), [reportRows])

  // --- Insight otomatis ---------------------------------------------------
  const insight = useMemo(() => {
    if (byKc.length === 0) return null
    const top = byKc[0]
    const bottom = byKc[byKc.length - 1]
    const weekTrend = trend.length >= 2 ? trend[trend.length - 1].jumlahVideo - trend[trend.length - 2].jumlahVideo : 0
    return { top, bottom, weekTrend }
  }, [byKc, trend])

  const totalVideoDist = roleDist.reduce((s, r) => s + r.value, 0)

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="eyebrow flex items-center gap-2">
          <BarChart3 size={13} />
          Section 4
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Data Analyst</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Analisis kinerja roleplay lintas KC Induk RO Surabaya: ranking, tren mingguan,
          distribusi peran, dan skor per parameter — klik bar/chart untuk menelusuri lebih dalam.
        </p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={BarChart3} label="Penyelesaian Roleplay" value={summary.totalEvaluasi} accent="brand" delay={0} />
        <StatCard icon={TrendingUp} label="Skor Kelulusan" value={summary.passRate} suffix="%" accent="pass" delay={0.05} />
        <StatCard icon={PieIcon} label="Skor Rata-Rata" value={summary.avgScore} suffix="%" accent="teal" delay={0.1} />
        <StatCard icon={RadarIcon} label="KC Induk Terpantau" value={summary.kcActive} accent="warn" delay={0.15} />
      </div>

      {/* --- Insight banner otomatis --- */}
      {insight && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <InsightCard
            icon={Trophy}
            tone="pass"
            title="KC Induk terbaik"
            body={`${insight.top.kcInduk} memimpin dengan skor rata-rata ${insight.top.skorRataRata}% dari ${insight.top.totalUnit} unit.`}
          />
          <InsightCard
            icon={AlertTriangle}
            tone="fail"
            title="Perlu perhatian"
            body={`${insight.bottom.kcInduk} berada di posisi terbawah dengan skor ${insight.bottom.skorRataRata}% — pertimbangkan pendampingan tambahan.`}
          />
          <InsightCard
            icon={insight.weekTrend > 0 ? TrendingUp : insight.weekTrend < 0 ? TrendingDown : Minus}
            tone={insight.weekTrend > 0 ? 'pass' : insight.weekTrend < 0 ? 'fail' : 'warn'}
            title="Tren minggu terakhir"
            body={
              insight.weekTrend === 0
                ? 'Volume submission video stabil dibanding minggu sebelumnya.'
                : `Submission video ${insight.weekTrend > 0 ? 'naik' : 'turun'} ${Math.abs(insight.weekTrend)} video dibanding minggu sebelumnya.`
            }
          />
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Ranking Skor per KC Induk (Terbaik → Terendah)"
          delay={0.1}
          insight="Klik salah satu bar untuk memfokuskan grafik Skor per Parameter di bawah pada KC Induk tersebut."
        >
          <ResponsiveContainer width="100%" height={Math.max(320, byKc.length * 26)}>
            <BarChart data={byKc} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis
                type="category"
                dataKey="kcInduk"
                width={150}
                tick={{ fontSize: 10, fill: axisColor }}
                interval={0}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Skor rata-rata']} />
              <Bar
                dataKey="skorRataRata"
                radius={[0, 6, 6, 0]}
                cursor="pointer"
                onClick={(data) => setKcFocus(data.kcInduk)}
                maxBarSize={16}
              >
                {byKc.map((entry) => (
                  <Cell
                    key={entry.kcInduk}
                    fill={scoreColor(entry.skorRataRata)}
                    opacity={kcFocus === 'Semua' || kcFocus === entry.kcInduk ? 1 : 0.35}
                  />
                ))}
                <LabelList dataKey="skorRataRata" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 10, fill: axisColor }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tren Submisi Video Mingguan" delay={0.15} insight="Menunjukkan volume video roleplay yang masuk tiap minggu — lonjakan/penurunan tajam bisa jadi sinyal deadline atau kendala lapangan.">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="minggu" tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Video masuk']} />
              <Line
                type="monotone"
                dataKey="jumlahVideo"
                stroke="#2DD4BF"
                strokeWidth={2.5}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribusi Video per Peran" delay={0.2} insight="Proporsi video roleplay yang sudah masuk untuk tiap peran/parameter — peran dengan porsi kecil berarti masih banyak unit yang belum submit.">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={roleDist}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={100}
                paddingAngle={3}
                cursor="pointer"
              >
                {roleDist.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="outside"
                  formatter={(v) => (totalVideoDist ? `${Math.round((v / totalVideoDist) * 100)}%` : '')}
                  style={{ fontSize: 10, fill: axisColor }}
                />
              </Pie>
              <text x="50%" y="47%" textAnchor="middle" className="fill-ink" style={{ fontSize: 24, fontWeight: 700 }}>
                {totalVideoDist}
              </text>
              <text x="50%" y="56%" textAnchor="middle" style={{ fontSize: 10, fill: axisColor }}>
                total video
              </text>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Skor per Parameter"
          delay={0.25}
          insight={`Menampilkan pemenuhan tiap parameter roleplay untuk ${kcFocus === 'Semua' ? 'seluruh RO Surabaya' : kcFocus}. Titik yang mendekati tepi radar berarti parameter tsb sudah hampir 100% terpenuhi.`}
          headerRight={
            <select
              value={kcFocus}
              onChange={(e) => setKcFocus(e.target.value)}
              className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-xs text-ink focus:border-brand/50 focus:outline-none"
            >
              <option>Semua</option>
              {kcOptions.map((kc) => (
                <option key={kc}>{kc}</option>
              ))}
            </select>
          }
        >
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radar}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis dataKey="parameter" tick={{ fontSize: 10, fill: axisColor }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: axisColor }} domain={[0, 100]} />
              <RadarArea dataKey="skor" stroke="#005BAB" fill="#005BAB" fillOpacity={0.35} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Pemenuhan']} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UnitListPanel
          icon={Trophy}
          tone="pass"
          title="Top 5 Unit Terbaik"
          units={best}
          delay={0.3}
        />
        <UnitListPanel
          icon={AlertTriangle}
          tone="fail"
          title="Unit Perlu Perhatian"
          units={lowest}
          delay={0.32}
        />
      </div>
    </div>
  )
}

function InsightCard({ icon: Icon, tone, title, body }) {
  const toneClasses = {
    pass: 'border-pass/25 bg-pass/5 text-pass',
    fail: 'border-fail/25 bg-fail/5 text-fail',
    warn: 'border-warn/25 bg-warn/5 text-warn',
  }
  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <Icon size={14} /> {title}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">{body}</p>
    </div>
  )
}

function ChartCard({ title, children, delay = 0, headerRight, insight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="panel p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">{title}</p>
        {headerRight}
      </div>
      {children}
      {insight && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-surface-raised px-3 py-2 text-xs leading-relaxed text-ink-muted">
          <Lightbulb size={13} className="mt-0.5 flex-shrink-0 text-brand" />
          {insight}
        </p>
      )}
    </motion.div>
  )
}

function UnitListPanel({ icon: Icon, tone, title, units, delay }) {
  const toneBar = tone === 'pass' ? 'bg-pass' : 'bg-fail'
  const toneText = tone === 'pass' ? 'text-pass' : 'text-fail'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="panel p-5"
    >
      <p className={`mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest ${toneText}`}>
        <Icon size={13} /> {title}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {units.map((unit) => (
          <div key={unit.id} className="rounded-xl border border-border bg-surface-raised p-3">
            <p className="truncate text-sm font-medium text-ink">{unit.namaUko}</p>
            <p className="font-mono text-[11px] text-ink-faint">{unit.kcInduk}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
              <div className={`h-full rounded-full ${toneBar}`} style={{ width: `${unit.score}%` }} />
            </div>
            <p className={`mt-1 text-right font-mono text-[11px] ${toneText}`}>{unit.score}%</p>
          </div>
        ))}
        {units.length === 0 && <p className="text-sm text-ink-muted">Belum ada data yang cukup untuk dianalisis.</p>}
      </div>
    </motion.div>
  )
}
