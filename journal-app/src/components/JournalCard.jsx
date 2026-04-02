import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const MOOD_COLORS = {
  great: 'bg-emerald-400',
  good: 'bg-emerald-300',
  okay: 'bg-amber-400',
  low: 'bg-red-400',
  anxious: 'bg-orange-400',
}

function getMoodDot(mood) {
  if (!mood) return 'bg-text-muted/40'
  const lower = mood.toLowerCase()
  for (const [key, cls] of Object.entries(MOOD_COLORS)) {
    if (lower.includes(key)) return cls
  }
  return 'bg-purple-400'
}

export default function JournalCard({ journal, index = 0 }) {
  const { slug, date, title, mood, thumbnail, highlights } = journal

  const d = new Date(date + 'T00:00:00')
  const formattedDate = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link
        to={`/journal/${slug}`}
        className="group block bg-surface-raised rounded-xl overflow-hidden border border-border hover:border-brand-500/25 transition-all duration-200"
      >
        {/* Image */}
        {thumbnail ? (
          <div className="aspect-[16/10] overflow-hidden bg-surface-overlay">
            <img
              src={`/journals/${thumbnail}`}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gradient-to-br from-brand-950/50 to-surface-overlay flex items-center justify-center">
            <div className="w-10 h-10 rounded-lg bg-brand-600/10 border border-brand-500/15" />
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${getMoodDot(mood)}`} />
            <time className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
              {formattedDate}
            </time>
          </div>

          <h2 className="text-sm font-medium text-text-primary group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
            {title}
          </h2>

          {mood && (
            <p className="mt-1.5 text-xs text-text-muted line-clamp-1">{mood}</p>
          )}

          {highlights && highlights.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {highlights.slice(0, 2).map((h, i) => (
                <span
                  key={i}
                  className="inline-block px-2 py-0.5 text-[10px] font-medium bg-surface-overlay border border-border-subtle rounded text-text-muted truncate max-w-[120px]"
                >
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
