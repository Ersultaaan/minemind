# MineMind 💣

> Train your logic. Calculate your risk. Clear the board.

A modern Minesweeper game built with React + Vite, focused on training logical and probabilistic thinking.

## Features

- 🎮 Three difficulty levels: Easy (8×8/10 mines), Medium (12×12/25), Hard (16×16/45)
- ⚡ Smart Hint system — analyzes board state and gives logical deductions
- 🚩 Left click to open, right click (or long-press on mobile) to flag
- ⏱️ Timer, flag counter, mine counter
- 📊 Persistent stats (wins, losses, best time) per difficulty via localStorage
- 📱 Fully responsive — works great on mobile
- 🌑 Dark terminal aesthetic

## Getting Started

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── main.jsx          # Entry point
├── App.jsx           # Root component & game orchestration
├── App.module.css    # App styles
├── Board.jsx         # Grid renderer
├── Board.module.css
├── Cell.jsx          # Individual cell (open/flag/mine states)
├── Cell.module.css
├── constants.js      # Difficulty configs, number classes
├── gameLogic.js      # Pure functions: mine placement, flood fill, hints
├── useStats.js       # localStorage stats hook
├── useTimer.js       # Timer hook
└── index.css         # Global CSS variables & resets
```
