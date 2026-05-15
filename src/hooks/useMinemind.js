import { useState, useEffect, useRef, useCallback } from 'react'

export const DIFFICULTIES = {
  easy:   { label: 'Easy',   rows: 8,  cols: 8,  mines: 10 },
  medium: { label: 'Medium', rows: 12, cols: 12, mines: 25 },
  hard:   { label: 'Hard',   rows: 16, cols: 16, mines: 45 },
}

function getNeighbors(idx, rows, cols) {
  const r = Math.floor(idx / cols)
  const c = idx % cols
  const result = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
        result.push(nr * cols + nc)
    }
  }
  return result
}

function buildEmptyState(diff) {
  const { rows, cols } = DIFFICULTIES[diff]
  return {
    rows,
    cols,
    board: new Array(rows * cols).fill(0),
    mines: new Set(),
    open: new Set(),
    flags: new Set(),
    done: false,
    won: false,
    hitIdx: -1,
    started: false,
  }
}

function placeMines(state, safeIdx) {
  const { rows, cols } = state
  const total = rows * cols
  const diff = Object.keys(DIFFICULTIES).find(
    k => DIFFICULTIES[k].rows === rows && DIFFICULTIES[k].cols === cols
  )
  const mineCount = DIFFICULTIES[diff].mines

  const pool = []
  for (let i = 0; i < total; i++) if (i !== safeIdx) pool.push(i)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const mines = new Set(pool.slice(0, mineCount))

  const board = new Array(total).fill(0)
  for (let i = 0; i < total; i++) {
    if (mines.has(i)) { board[i] = -1; continue }
    board[i] = getNeighbors(i, rows, cols).filter(n => mines.has(n)).length
  }

  return { ...state, mines, board }
}

function floodOpen(state, startIdx) {
  const { rows, cols, board, mines, flags } = state
  const open = new Set(state.open)
  const queue = [startIdx]
  while (queue.length) {
    const i = queue.shift()
    if (open.has(i)) continue
    open.add(i)
    if (board[i] === 0) {
      getNeighbors(i, rows, cols).forEach(n => {
        if (!open.has(n) && !flags.has(n) && !mines.has(n)) queue.push(n)
      })
    }
  }
  return { ...state, open }
}

// ── Stats helpers ──────────────────────────────────────────────────────────
export function loadStats() {
  try { return JSON.parse(localStorage.getItem('minemind_stats') || '{}') }
  catch { return {} }
}

export function saveStats(stats) {
  try { localStorage.setItem('minemind_stats', JSON.stringify(stats)) }
  catch {}
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

// ── Main hook ──────────────────────────────────────────────────────────────
export function useMinemind() {
  const [diff, setDiff] = useState('easy')
  const [gameState, setGameState] = useState(() => buildEmptyState('easy'))
  const [elapsed, setElapsed] = useState(0)
  const [stats, setStats] = useState(loadStats)
  const timerRef = useRef(null)

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }, [stopTimer])

  const newGame = useCallback((newDiff) => {
    const d = newDiff || diff
    stopTimer()
    setElapsed(0)
    setGameState(buildEmptyState(d))
  }, [diff, stopTimer])

  const changeDiff = useCallback((d) => {
    setDiff(d)
    stopTimer()
    setElapsed(0)
    setGameState(buildEmptyState(d))
  }, [stopTimer])

  const recordResult = useCallback((won, time) => {
    setStats(prev => {
      const next = { ...prev }
      if (!next[diff]) next[diff] = { wins: 0, losses: 0, best: null }
      const entry = { ...next[diff] }
      if (won) {
        entry.wins++
        if (entry.best === null || time < entry.best) entry.best = time
      } else {
        entry.losses++
      }
      next[diff] = entry
      saveStats(next)
      return next
    })
  }, [diff])

  const openCell = useCallback((idx) => {
    setGameState(prev => {
      if (prev.done || prev.open.has(idx) || prev.flags.has(idx)) return prev

      let state = prev
      if (!prev.started) {
        state = placeMines(prev, idx)
        state = { ...state, started: true }
        startTimer()
      }

      if (state.mines.has(idx)) {
        stopTimer()
        const open = new Set(state.open)
        state.mines.forEach(m => open.add(m))
        const newState = { ...state, open, done: true, won: false, hitIdx: idx }
        setTimeout(() => recordResult(false, elapsed), 0)
        return newState
      }

      state = floodOpen(state, idx)
      const safeCells = state.rows * state.cols - state.mines.size
      if (state.open.size >= safeCells) {
        stopTimer()
        const newState = { ...state, done: true, won: true }
        setTimeout(() => recordResult(true, elapsed), 0)
        return newState
      }
      return state
    })
  }, [startTimer, stopTimer, recordResult, elapsed])

  const toggleFlag = useCallback((idx) => {
    setGameState(prev => {
      if (prev.done || prev.open.has(idx)) return prev
      const flags = new Set(prev.flags)
      if (flags.has(idx)) flags.delete(idx)
      else flags.add(idx)
      return { ...prev, flags }
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stopTimer(), [stopTimer])

  const mineCount = DIFFICULTIES[diff].mines
  const flagCount = gameState.flags.size
  const remaining = mineCount - flagCount

  return {
    diff, changeDiff,
    gameState,
    elapsed, mineCount, flagCount, remaining,
    stats,
    newGame, openCell, toggleFlag,
  }
}
