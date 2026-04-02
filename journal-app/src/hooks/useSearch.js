import { useState, useEffect, useRef } from 'react'
import { searchJournals } from '../lib/api'

export default function useSearch(query, { debounceMs = 300, topK = 5 } = {}) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      setResults(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)

    const timer = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      searchJournals(trimmed, topK, controller.signal)
        .then(data => {
          setResults(data.results)
          setError(null)
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            setError(err.message)
            setResults(null)
          }
        })
        .finally(() => setLoading(false))
    }, debounceMs)

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [query, debounceMs, topK])

  return { results, loading, error }
}
