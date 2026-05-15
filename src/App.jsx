import React, { useState, useCallback } from 'react'
import Board from './Board.jsx'
import { DIFFICULTIES } from './constants.js'
import {
  buildEmptyGame,
  placeMines,
  floodOpen,
  checkWin,
  computeHint,
} from './gameLogic.js'
import { useStats } from './useStats.js'
import { useTimer, formatTime } from './useTimer.js'
import styles from './App.module.css'

export default function App() {
  const [diff, setDiff] = useState('easy')
  const [game, setGame] = useState(() => ({ ...buildEmptyGame('easy'), started: false }))
  const [hint, setHint] = useState(null)
  const { current: stats, record } = useStats(diff)
  const { elapsed, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer()

  const startNewGame = useCallback((d = diff) => {
    resetTimer()
    setHint(null)
    setGame({ ...buildEmptyGame(d), started: false })
  }, [diff, resetTimer])

  const handleDiff = useCallback((d) => {
    setDiff(d)
    startNewGame(d)
  }, [startNewGame])

  const handleOpen = useCallback((idx) => {
    setGame(prev => {
      if (prev.done || prev.open.has(idx) || prev.flags.has(idx)) return prev

      let g = prev
      if (!g.started) {
        g = { ...placeMines(g, idx), started: true }
        startTimer()
      }

      if (g.mines.has(idx)) {
        const allOpen = new Set(g.open)
        g.mines.forEach(m => allOpen.add(m))
        stopTimer()
        record(false, elapsed)
        return { ...g, open: allOpen, done: true, won: false, hitIdx: idx }
      }

      g = floodOpen(g, idx)

      if (checkWin(g)) {
        stopTimer()
        record(true, elapsed)
        return { ...g, done: true, won: true }
      }

      return g
    })
  }, [startTimer, stopTimer, record, elapsed])

  const handleFlag = useCallback((idx) => {
    setGame(prev => {
      if (prev.done || prev.open.has(idx)) return prev
      const flags = new Set(prev.flags)
      if (flags.has(idx)) flags.delete(idx)
      else flags.add(idx)
      return { ...prev, flags }
    })
  }, [])

  const handleHint = useCallback(() => {
    setHint(computeHint(game, diff))
  }, [game, diff])

  const status = game.done
    ? (game.won ? 'win' : 'lose')
    : (game.started ? 'playing' : 'idle')

  const statusMessages = {
    win: '🎉 Board cleared! You win!',
    lose: '💥 Mine triggered! Game over.',
    playing: `${DIFFICULTIES[diff].mines - game.flags.size} mines remaining`,
    idle: 'Click any cell to start',
  }

  return (
    <div className={styles.app}>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          Mine<span className={styles.accent}>Mind</span>
        </h1>
        <p className={styles.sub}>
          Train your logic
          <span className={styles.dot}> · </span>
          Calculate your risk
          <span className={styles.dot}> · </span>
          Clear the board
        </p>
      </header>

      <main className={styles.panel}>
        {/* Difficulty */}
        <div className={styles.diffRow}>
          {Object.entries(DIFFICULTIES).map(([key, d]) => (
            <button
              key={key}
              className={`${styles.diffBtn} ${diff === key ? styles.diffActive : ''}`}
              onClick={() => handleDiff(key)}
            >
              {d.label}
              <span className={styles.diffMeta}>{d.rows}×{d.cols} / {d.mines}💣</span>
            </button>
          ))}
        </div>

        {/* HUD */}
        <div className={styles.hud}>
          <div className={styles.hudCard}>
            <div className={`${styles.hudVal} ${styles.danger}`}>{DIFFICULTIES[diff].mines}</div>
            <div className={styles.hudLabel}>Mines</div>
          </div>
          <div className={styles.hudCard}>
            <div className={`${styles.hudVal} ${styles.flagCol}`}>{game.flags.size}</div>
            <div className={styles.hudLabel}>Flags</div>
          </div>
          <div className={styles.hudCard}>
            <div className={`${styles.hudVal} ${styles.timerCol}`}>{formatTime(elapsed)}</div>
            <div className={styles.hudLabel}>Time</div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnRestart} onClick={() => startNewGame()}>↺ New Game</button>
          <button
            className={styles.btnHint}
            onClick={handleHint}
            disabled={game.done}
          >
            ⚡ Hint
          </button>
        </div>

        {/* Hint */}
        {hint && (
          <div
            className={styles.hintBox}
            dangerouslySetInnerHTML={{ __html: hint }}
          />
        )}

        {/* Status */}
        <div className={`${styles.statusBar} ${styles[status]}`}>
          {statusMessages[status]}
        </div>

        {/* Board */}
        <Board game={game} onOpen={handleOpen} onFlag={handleFlag} />

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.wins}`}>{stats.wins}</div>
            <div className={styles.statLabel}>Wins</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.losses}`}>{stats.losses}</div>
            <div className={styles.statLabel}>Losses</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.best}`}>
              {stats.best !== null ? formatTime(stats.best) : '—'}
            </div>
            <div className={styles.statLabel}>Best Time</div>
          </div>
        </div>
      </main>
    </div>
  )
}
