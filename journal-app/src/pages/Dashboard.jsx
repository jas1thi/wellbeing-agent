import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, MessageSquare, PenLine, Flame } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import MoodTimeline from '../components/MoodTimeline'
import useJournals from '../hooks/useJournals'
import useStats from '../hooks/useStats'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay },
})

export default function Dashboard() {
  const { journals, loading: journalsLoading } = useJournals()
  const { stats, loading: statsLoading } = useStats()
  const loading = journalsLoading || statsLoading

  return (
    <PageWrapper>
      {/* Header with streak */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">{getGreeting()}</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && stats && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Flame size={16} className="text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{stats.current_streak}</span>
              <span className="text-[10px] text-amber-400/70 uppercase font-medium">day streak</span>
            </div>
          )}
          <Link
            to="/chat"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PenLine size={15} />
            Check-in
          </Link>
        </div>
      </div>

      {loading ? <LoadingSkeleton /> : (
        <>
          {/* Mood Tracker — colored rings */}
          {stats?.recent_moods?.length > 0 && (
            <motion.div {...fadeUp(0.05)} className="mb-8">
              <MoodTimeline recentMoods={stats.recent_moods} />
            </motion.div>
          )}

          {/* Feed */}
          {journals.length > 0 && (
            <motion.div {...fadeUp(0.1)} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Recent</p>
                <Link to="/entries" className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-0.5">
                  All <ArrowRight size={10} />
                </Link>
              </div>
              <div className="space-y-2.5">
                {journals.slice(0, 5).map((j) => (
                  <FeedCard key={j.slug} journal={j} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Photo Grid */}
          {(() => {
            const withImages = journals.filter(j => j.thumbnail)
            if (withImages.length === 0) return null
            return (
              <motion.div {...fadeUp(0.2)}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Gallery</p>
                  <Link to="/entries" className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-0.5">
                    All <ArrowRight size={10} />
                  </Link>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {withImages.slice(0, 12).map((j) => (
                    <Link
                      key={j.slug}
                      to={`/journal/${j.slug}`}
                      className="aspect-square rounded-xl overflow-hidden bg-surface-overlay group"
                    >
                      <img
                        src={`/journals/${j.thumbnail}`}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </Link>
                  ))}
                </div>
              </motion.div>
            )
          })()}

          {journals.length === 0 && <EmptyState />}
        </>
      )}
    </PageWrapper>
  )
}

function FeedCard({ journal }) {
  const { slug, date, title, mood, thumbnail } = journal
  const d = new Date(date + 'T00:00:00')
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Link
      to={`/journal/${slug}`}
      className="flex items-center gap-3.5 px-3.5 py-3 bg-surface-raised border border-border rounded-xl hover:border-brand-500/20 transition-all group"
    >
      {thumbnail ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-overlay shrink-0">
          <img src={`/journals/${thumbnail}`} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-surface-overlay border border-border/50 flex items-center justify-center shrink-0">
          <BookOpen size={16} className="text-text-muted" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary group-hover:text-brand-400 transition-colors truncate">
          {title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-text-muted">{dateStr}</span>
          {mood && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-[11px] text-text-muted truncate">{mood}</span>
            </>
          )}
        </div>
      </div>
      <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function EmptyState() {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
        <BookOpen size={22} className="text-brand-400" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1.5">No entries yet</h3>
      <p className="text-sm text-text-muted mb-5 max-w-xs mx-auto">Start a check-in to create your first journal entry.</p>
      <Link to="/chat" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors">
        <MessageSquare size={15} /> Start Check-in
      </Link>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex gap-2.5 overflow-hidden">
        {[...Array(10)].map((_, i) => <div key={i} className="w-[50px] h-[50px] rounded-full bg-surface-raised border border-border shrink-0" />)}
      </div>
      <div className="space-y-2.5">
        {[...Array(5)].map((_, i) => <div key={i} className="bg-surface-raised border border-border rounded-xl h-[72px]" />)}
      </div>
    </div>
  )
}
