import { useState, useCallback } from 'react'

const STORAGE_KEY = 'minemind_stats'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function save(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

export function useStats(diff) {
  const [stats, setStats] = useState(load)

  const record = useCallback((won, elapsed) => {
    setStats(prev => {
      const next = { ...prev }
      if (!next[diff]) next[diff] = { wins: 0, losses: 0, best: null }
      const entry = { ...next[diff] }
      if (won) {
        entry.wins++
        if (entry.best === null || elapsed < entry.best) entry.best = elapsed
      } else {
        entry.losses++
      }
      next[diff] = entry
      save(next)
      return next
    })
  }, [diff])

  const current = stats[diff] || { wins: 0, losses: 0, best: null }
  return { current, record }
}
