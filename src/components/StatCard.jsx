import { motion } from 'framer-motion'

export default function StatCard({ icon: Icon, label, value, suffix = '', accent = 'brand', delay = 0 }) {
  const accentMap = {
    brand: 'text-brand bg-brand/10',
    teal: 'text-teal bg-teal/10',
    pass: 'text-pass bg-pass/10',
    warn: 'text-warn bg-warn/10',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="panel group relative overflow-hidden p-5"
    >
      <div className="absolute inset-0 bg-grid-lines bg-grid opacity-[0.03]" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {value}
            <span className="text-lg text-ink-muted">{suffix}</span>
          </p>
        </div>
        <span className={`rounded-xl p-2.5 ${accentMap[accent]}`}>
          <Icon size={18} strokeWidth={2} />
        </span>
      </div>
    </motion.div>
  )
}
