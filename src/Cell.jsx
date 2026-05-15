import React, { useRef } from 'react'
import { NUM_CLASSES } from './constants.js'
import styles from './Cell.module.css'

export default function Cell({ idx, value, isOpen, isMine, isFlag, isHit, onClick, onFlag }) {
  const touchTimer = useRef(null)
  const didLongPress = useRef(false)

  function handleTouchStart() {
    didLongPress.current = false
    touchTimer.current = setTimeout(() => {
      didLongPress.current = true
      onFlag(idx)
    }, 400)
  }

  function handleTouchEnd(e) {
    clearTimeout(touchTimer.current)
    if (!didLongPress.current) {
      e.preventDefault()
      onClick(idx)
    }
  }

  function handleClick() {
    onClick(idx)
  }

  function handleContext(e) {
    e.preventDefault()
    onFlag(idx)
  }

  let cls = styles.cell
  let content = null

  if (isOpen) {
    if (isMine) {
      cls += isHit ? ` ${styles.mineHit}` : ` ${styles.mineRev}`
      content = '💣'
    } else {
      cls += ` ${styles.open}`
      if (value > 0) {
        content = <span className={styles[NUM_CLASSES[value]]}>{value}</span>
      }
    }
  } else if (isFlag) {
    cls += ` ${styles.flagged}`
    content = '🚩'
  } else {
    cls += ` ${styles.closed}`
  }

  return (
    <div
      className={cls}
      onClick={handleClick}
      onContextMenu={handleContext}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {content}
    </div>
  )
}
