import React from 'react'
import Cell from './Cell.jsx'
import styles from './Board.module.css'

export default function Board({ game, onOpen, onFlag }) {
  const { rows, cols, board, mines, open, flags, hitIdx } = game

  return (
    <div className={styles.wrap}>
      <div
        className={styles.board}
        style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}
      >
        {board.map((val, idx) => (
          <Cell
            key={idx}
            idx={idx}
            value={val}
            isOpen={open.has(idx)}
            isMine={mines.has(idx)}
            isFlag={flags.has(idx)}
            isHit={idx === hitIdx}
            onClick={onOpen}
            onFlag={onFlag}
          />
        ))}
      </div>
    </div>
  )
}
