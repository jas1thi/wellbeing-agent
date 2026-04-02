import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import PageWrapper from '../components/PageWrapper'
import useJournals from '../hooks/useJournals'

const MOOD_COLORS = {
  great: 'bg-mood-great',
  good: 'bg-mood-good',
  okay: 'bg-mood-okay',
  low: 'bg-mood-low',
  anxious: 'bg-mood-anxious',
}

function getMoodColor(mood) {
  if (!mood) return null
  const lower = mood.toLowerCase()
  for (const [key, cls] of Object.entries(MOOD_COLORS)) {
    if (lower.includes(key)) return cls
  }
  return 'bg-mood-mixed'
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { journals, loading } = useJournals()

  // Build a map of date -> journal entries
  const journalMap = {}
  for (const j of journals) {
    const dateKey = j.date
    if (!journalMap[dateKey]) journalMap[dateKey] = []
    journalMap[dateKey].push(j)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-text-primary">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-surface-raised border border-border hover:border-brand-500/30 text-text-secondary hover:text-brand-400 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-medium text-text-primary min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-surface-raised border border-border hover:border-brand-500/30 text-text-secondary hover:text-brand-400 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <motion.div
        key={format(currentMonth, 'yyyy-MM')}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-surface-raised border border-border rounded-2xl overflow-hidden"
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-3 py-3 text-xs font-medium text-text-muted text-center uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const entries = journalMap[dateKey] || []
            const inMonth = isSameMonth(day, currentMonth)
            const today = isToday(day)
            const hasEntries = entries.length > 0
            const mood = entries[0]?.mood

            return (
              <div
                key={i}
                className={`min-h-[100px] p-2 border-b border-r border-border/50 transition-colors ${
                  inMonth ? '' : 'opacity-30'
                } ${hasEntries ? 'hover:bg-surface-overlay cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      today
                        ? 'bg-brand-600 text-white'
                        : 'text-text-secondary'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {mood && (
                    <div className={`w-2.5 h-2.5 rounded-full ${getMoodColor(mood)}`} />
                  )}
                </div>

                {entries.map((entry) => (
                  <Link
                    key={entry.slug}
                    to={`/journal/${entry.slug}`}
                    className="block mt-1 px-2 py-1 text-xs bg-brand-600/10 border border-brand-500/15 rounded-md text-brand-300 truncate hover:bg-brand-600/20 transition-colors"
                  >
                    {entry.title?.replace(/^(Wellbeing Journal|Journal Entry)\s*[-–—]\s*/i, '').slice(0, 30)}
                  </Link>
                ))}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 justify-center">
        {[
          { label: 'Great', color: 'bg-mood-great' },
          { label: 'Good', color: 'bg-mood-good' },
          { label: 'Okay', color: 'bg-mood-okay' },
          { label: 'Anxious', color: 'bg-mood-anxious' },
          { label: 'Low', color: 'bg-mood-low' },
          { label: 'Mixed', color: 'bg-mood-mixed' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-text-muted">{label}</span>
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}
