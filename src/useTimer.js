import { useState, useRef, useCallback } from 'react'

export function useTimer() {
  const [elapsed, setElapsed] = useState(0)
  const ref = useRef(null)

  const start = useCallback(() => {
    if (ref.current) return
    ref.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }, [])

  const stop = useCallback(() => {
    clearInterval(ref.current)
    ref.current = null
  }, [])

  const reset = useCallback(() => {
    clearInterval(ref.current)
    ref.current = null
    setElapsed(0)
  }, [])

  return { elapsed, start, stop, reset }
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
