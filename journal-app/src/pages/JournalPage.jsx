import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Share2 } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import MarkdownRenderer from '../components/MarkdownRenderer'
import SharePreview from '../components/SharePreview'
import useJournals from '../hooks/useJournals'

export default function JournalPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { journals, loading } = useJournals()
  const journal = journals.find(j => j.slug === slug)
  const [showShare, setShowShare] = useState(false)

  const currentIndex = journals.findIndex(j => j.slug === slug)
  const prevJournal = journals[currentIndex + 1] || null
  const nextJournal = journals[currentIndex - 1] || null

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft' && prevJournal) navigate(`/journal/${prevJournal.slug}`)
      if (e.key === 'ArrowRight' && nextJournal) navigate(`/journal/${nextJournal.slug}`)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [prevJournal, nextJournal, navigate])

  if (loading) {
    return (
      <PageWrapper>
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-20 bg-surface-overlay rounded" />
          <div className="h-6 w-1/3 bg-surface-overlay rounded" />
          <div className="h-64 bg-surface-raised border border-border rounded-xl" />
        </div>
      </PageWrapper>
    )
  }

  if (!journal) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mx-auto mb-4">
            <Search size={20} className="text-text-muted" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-1.5">Entry not found</h1>
          <Link to="/entries" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
            Back to entries
          </Link>
        </div>
      </PageWrapper>
    )
  }

  const formattedDate = new Date(journal.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <PageWrapper>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/entries"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-400 transition-colors"
        >
          <ArrowLeft size={14} />
          All Entries
        </Link>
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-surface-raised border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-brand-400 hover:border-brand-500/25 transition-all"
        >
          <Share2 size={14} />
          Share
        </button>
      </div>

      <motion.article
        key={slug}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-surface-raised border border-border rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-border/60">
          <div className="flex items-center gap-3 flex-wrap">
            <time className="text-sm font-medium text-brand-400">{formattedDate}</time>
            {journal.mood && (
              <span className="text-xs bg-brand-600/8 text-brand-300 border border-brand-500/15 px-2.5 py-0.5 rounded-full">
                {journal.mood}
              </span>
            )}
          </div>
          {journal.highlights && journal.highlights.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {journal.highlights.map((h, i) => (
                <span
                  key={i}
                  className="inline-block px-2.5 py-1 text-[11px] font-medium bg-surface-overlay border border-border/60 rounded-lg text-text-secondary"
                >
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-8 py-7">
          <MarkdownRenderer content={journal.content} />
        </div>
      </motion.article>

      {/* Nav */}
      <nav className="mt-5 flex justify-between items-center">
        {prevJournal ? (
          <Link
            to={`/journal/${prevJournal.slug}`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-raised border border-border rounded-lg text-xs text-text-secondary hover:text-brand-400 hover:border-brand-500/25 transition-all"
          >
            <ChevronLeft size={14} />
            {prevJournal.date}
          </Link>
        ) : <span />}
        {nextJournal ? (
          <Link
            to={`/journal/${nextJournal.slug}`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-raised border border-border rounded-lg text-xs text-text-secondary hover:text-brand-400 hover:border-brand-500/25 transition-all"
          >
            {nextJournal.date}
            <ChevronRight size={14} />
          </Link>
        ) : <span />}
      </nav>

      <p className="text-center text-[11px] text-text-muted mt-3">
        Use arrow keys to navigate
      </p>

      {/* Share Modal */}
      <SharePreview
        journal={journal}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </PageWrapper>
  )
}
