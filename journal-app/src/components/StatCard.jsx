import { motion } from 'framer-motion'

const themes = {
  brand: {
    bg: 'bg-brand-600/[0.06]',
    border: 'border-brand-500/10',
    icon: 'text-brand-400 bg-brand-600/10',
  },
  green: {
    bg: 'bg-emerald-600/[0.06]',
    border: 'border-emerald-500/10',
    icon: 'text-emerald-400 bg-emerald-600/10',
  },
  amber: {
    bg: 'bg-amber-600/[0.06]',
    border: 'border-amber-500/10',
    icon: 'text-amber-400 bg-amber-600/10',
  },
  blue: {
    bg: 'bg-blue-600/[0.06]',
    border: 'border-blue-500/10',
    icon: 'text-blue-400 bg-blue-600/10',
  },
}

export default function StatCard({ icon: Icon, label, value, color = 'brand', delay = 0 }) {
  const t = themes[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={`${t.bg} border ${t.border} rounded-xl px-5 py-4`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-md ${t.icon}`}>
          <Icon size={14} strokeWidth={2} />
        </div>
        <span className="text-xs font-medium text-text-muted">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-text-primary tracking-tight">{value}</p>
    </motion.div>
  )
}
