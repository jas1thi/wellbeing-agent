import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, FileText } from 'lucide-react'
import { useSearchModal } from '../hooks/useSearchModal'
import useSearch from '../hooks/useSearch'

export default function SearchModal() {
  const { isOpen, close } = useSearchModal()
  const [query, setQuery] = useState('')
  const { results, loading } = useSearch(query)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  function handleSelect(slug) {
    close()
    setQuery('')
    navigate(`/journal/${slug}`)
  }

  const parsedResults = parseResults(results)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl"
          >
            <div className="bg-surface-raised border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                {loading ? (
                  <Loader2 size={20} className="text-brand-400 animate-spin shrink-0" />
                ) : (
                  <Search size={20} className="text-text-muted shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search your journals..."
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-base"
                />
                <kbd className="px-2 py-0.5 text-[11px] font-medium bg-surface-overlay border border-border rounded text-text-muted">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {!query.trim() && (
                  <div className="px-5 py-8 text-center text-text-muted text-sm">
                    Type to search across all your journal entries
                  </div>
                )}

                {query.trim() && !loading && parsedResults.length === 0 && (
                  <div className="px-5 py-8 text-center text-text-muted text-sm">
                    No results found for "{query}"
                  </div>
                )}

                {parsedResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(result.slug)}
                    className="w-full text-left px-5 py-3.5 hover:bg-surface-overlay transition-colors border-b border-border/50 last:border-0 group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-brand-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-text-primary">
                            {result.dateFormatted}
                          </span>
                          <span className="text-xs text-brand-400/70 font-medium">
                            {result.score}% match
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary truncate">
                          {result.preview}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function parseResults(raw) {
  if (!raw || typeof raw !== 'string') return []

  return raw.split('\n\n---\n\n').map(section => {
    const headerMatch = section.match(/^### Result (\d+) \(date: (.+?), score: (.+?)\)/)
    if (!headerMatch) return null

    const [, , date, score] = headerMatch
    const body = section.replace(/^###.+\n/, '').trim()
    const preview = body
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('!'))
      .slice(0, 2)
      .join(' ')
      .slice(0, 150)

    const dateOnly = date.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
    const slug = date
    const d = dateOnly ? new Date(dateOnly + 'T00:00:00') : null
    const dateFormatted = d && !isNaN(d)
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : date

    return {
      slug,
      dateFormatted,
      score: Math.max(0, Math.round(parseFloat(score) * 100)),
      preview: preview || 'Journal entry',
    }
  }).filter(Boolean)
}
