import { DIFFICULTIES } from './constants.js'

export function getNeighbors(idx, rows, cols) {
  const r = Math.floor(idx / cols)
  const c = idx % cols
  const result = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        result.push(nr * cols + nc)
      }
    }
  }
  return result
}

export function buildEmptyGame(diffKey) {
  const d = DIFFICULTIES[diffKey]
  const total = d.rows * d.cols
  return {
    rows: d.rows,
    cols: d.cols,
    totalMines: d.mines,
    board: new Array(total).fill(0),
    mines: new Set(),
    flags: new Set(),
    open: new Set(),
    done: false,
    won: false,
    hitIdx: -1,
  }
}

export function placeMines(game, safeIdx) {
  const { rows, cols, totalMines } = game
  const total = rows * cols
  const pool = []
  for (let i = 0; i < total; i++) if (i !== safeIdx) pool.push(i)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const mines = new Set(pool.slice(0, totalMines))
  const board = new Array(total).fill(0)
  for (let i = 0; i < total; i++) {
    if (mines.has(i)) { board[i] = -1; continue }
    let cnt = 0
    getNeighbors(i, rows, cols).forEach(n => { if (mines.has(n)) cnt++ })
    board[i] = cnt
  }
  return { ...game, mines, board }
}

export function floodOpen(game, startIdx) {
  const { rows, cols, board, open, flags, mines } = game
  const newOpen = new Set(open)
  const q = [startIdx]
  while (q.length) {
    const i = q.shift()
    if (newOpen.has(i)) continue
    newOpen.add(i)
    if (board[i] === 0) {
      getNeighbors(i, rows, cols).forEach(n => {
        if (!newOpen.has(n) && !flags.has(n) && !mines.has(n)) q.push(n)
      })
    }
  }
  return { ...game, open: newOpen }
}

export function checkWin(game) {
  const safeCells = game.rows * game.cols - game.totalMines
  return game.open.size >= safeCells
}

export function computeHint(game, diffKey) {
  const { rows, cols, board, mines, open, flags, totalMines } = game
  const total = rows * cols

  if (!game.started) {
    return 'Start the game by clicking any cell. The first click is always safe. <strong>Try a corner or edge</strong> to maximize the opening flood.'
  }

  for (let i = 0; i < total; i++) {
    if (!open.has(i) || board[i] <= 0) continue
    const ns = getNeighbors(i, rows, cols)
    const closedNs = ns.filter(n => !open.has(n))
    const flaggedNs = ns.filter(n => flags.has(n))
    const unflagged = closedNs.filter(n => !flags.has(n))
    const remaining = board[i] - flaggedNs.length

    if (remaining === 0 && unflagged.length > 0) {
      return `<strong>Safe open available!</strong> A <strong>${board[i]}</strong>-cell has all its mines already flagged. You can safely click its remaining closed neighbors.`
    }
    if (remaining === unflagged.length && unflagged.length > 0) {
      return `<strong>Flag opportunity!</strong> A <strong>${board[i]}</strong>-cell's unflagged neighbors (${unflagged.length}) exactly match its remaining mine count. Flag them all!`
    }
  }

  const flagged = flags.size
  const remainingMines = totalMines - flagged
  const closedUnflagged = []
  for (let i = 0; i < total; i++) {
    if (!open.has(i) && !flags.has(i)) closedUnflagged.push(i)
  }
  const prob = closedUnflagged.length > 0
    ? ((remainingMines / closedUnflagged.length) * 100).toFixed(0)
    : 0

  if (remainingMines === closedUnflagged.length) {
    return `<strong>Flag everything!</strong> Remaining mines (${remainingMines}) = remaining closed cells. Every closed unflagged cell is a mine!`
  }
  if (+prob < 20) {
    return `No forced moves right now. Mine density is low — <strong>${prob}% chance</strong> per unknown cell. Try opening cells adjacent to <strong>1s</strong> with many open neighbors.`
  }
  if (+prob > 60) {
    return `High mine density (<strong>${prob}%</strong>). Be careful. Focus on cells where the number exactly matches nearby closed neighbors — those are forced flags.`
  }
  return `No immediate logical deductions. Overall mine probability: <strong>${prob}%</strong> per unknown cell. Look for a <strong>1</strong> with only one closed neighbor — that's a forced flag.`
}
