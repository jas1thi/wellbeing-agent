import { useState, useEffect } from 'react'
import { getJournals } from '../lib/api'

export default function useJournals() {
  const [journals, setJournals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getJournals()
      .then(setJournals)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { journals, loading, error }
}
