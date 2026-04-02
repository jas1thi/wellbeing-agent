import { useState, useEffect } from 'react'
import { getStats } from '../lib/api'

export default function useStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
