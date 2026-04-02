import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Grid3X3, List, ArrowRight } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import JournalCard from '../components/JournalCard'
import useJournals from '../hooks/useJournals'
import { useSearchModal } from '../hooks/useSearchModal'

export default function EntriesPage() {
  const { journals, loading } = useJournals()
  const { open: openSearch } = useSearchModal()
  const [viewMode, setViewMode] = useState('grid')

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Entries</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {journals.length} {journals.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openSearch}
            className="px-3.5 py-2 text-xs text-text-muted bg-surface-raised border border-border rounded-lg hover:border-border hover:text-text-secondary transition-all"
          >
            Search...
          </button>
          <div className="flex items-center bg-surface-raised border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-brand-600/12 text-brand-400'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-600/12 text-brand-400'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton viewMode={viewMode} />
      ) : journals.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {journals.map((journal, i) => (
            <JournalCard key={journal.slug} journal={journal} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {journals.map((journal) => (
            <ListItem key={journal.slug} journal={journal} />
          ))}
        </div>
      )}
    </PageWrapper>
  )
}

function ListItem({ journal }) {
  const { slug, date, title, mood } = journal
  const d = new Date(date + 'T00:00:00')

  return (
    <Link
      to={`/journal/${slug}`}
      className="flex items-center gap-4 px-4 py-3.5 bg-surface-raised border border-border rounded-xl hover:border-brand-500/25 transition-all group"
    >
      <div className="text-center shrink-0 w-10">
        <p className="text-[10px] text-text-muted uppercase leading-none">
          {d.toLocaleDateString('en-US', { month: 'short' })}
        </p>
        <p className="text-lg font-semibold text-text-primary leading-tight mt-0.5">
          {d.getDate()}
        </p>
      </div>
      <div className="h-8 w-px bg-border shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary group-hover:text-brand-400 transition-colors truncate">
          {title}
        </h3>
        {mood && <p className="text-xs text-text-muted mt-0.5 truncate">{mood}</p>}
      </div>
      <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  )
}

function LoadingSkeleton({ viewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface-raised border border-border rounded-xl p-4 h-16 animate-pulse" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-surface-raised border border-border rounded-xl animate-pulse">
          <div className="aspect-[16/10] bg-surface-overlay rounded-t-xl" />
          <div className="p-4 space-y-2">
            <div className="h-2.5 w-16 bg-surface-overlay rounded" />
            <div className="h-3 w-3/4 bg-surface-overlay rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
        <BookOpen size={22} className="text-brand-400" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1.5">No entries yet</h3>
      <p className="text-sm text-text-muted">
        Chat with your wellbeing companion to create journal entries.
      </p>
    </div>
  )
}
