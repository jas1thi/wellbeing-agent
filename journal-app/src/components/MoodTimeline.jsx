import { Link } from 'react-router-dom'

const MOOD_META = {
  great: { color: '#10b981', label: 'Great' },
  good: { color: '#34d399', label: 'Good' },
  mixed: { color: '#a78bfa', label: 'Mixed' },
  okay: { color: '#fbbf24', label: 'Okay' },
  anxious: { color: '#fb923c', label: 'Anxious' },
  low: { color: '#f87171', label: 'Low' },
}

function classifyMood(mood) {
  if (!mood) return 'mixed'
  const lower = mood.toLowerCase()
  if (/great|amazing|fantastic|excellent|awesome|incredible/.test(lower)) return 'great'
  if (/good|positive|happy|solid|relieved/.test(lower)) return 'good'
  if (/okay|ok|alright|fine|neutral|decent|foggy/.test(lower)) return 'okay'
  if (/anxious|nervous|stressed|restless|uneasy/.test(lower)) return 'anxious'
  if (/bad|sad|low|down|rough|tired|drained|exhausted|frustrated/.test(lower)) return 'low'
  return 'mixed'
}

export default function MoodTimeline({ recentMoods }) {
  if (!recentMoods || recentMoods.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-text-muted text-sm">
        No mood data yet
      </div>
    )
  }

  // Oldest first, last 14
  const moods = [...recentMoods].reverse().slice(-14)

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
      {moods.map((entry, i) => {
        const key = classifyMood(entry.mood)
        const meta = MOOD_META[key]
        const d = new Date(entry.date + 'T00:00:00')
        const dayNum = d.getDate()
        const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' })

        return (
          <Link
            key={i}
            to={`/journal/${entry.slug}`}
            className="flex flex-col items-center gap-1 group shrink-0"
            title={`${entry.date}: ${meta.label}`}
          >
            <div
              className="w-[50px] h-[50px] rounded-full p-[2.5px] transition-transform group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}66)`,
              }}
            >
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                <span className="text-[13px] font-bold" style={{ color: meta.color }}>
                  {dayNum}
                </span>
              </div>
            </div>
            <span className="text-[9px] text-text-muted leading-none">{dayName}</span>
          </Link>
        )
      })}
    </div>
  )
}
