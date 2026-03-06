'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import {
  COLS,
  ROWS,
  BLOCS_AVANT_QUESTION,
  createEmptyBoard,
  randomPiece,
  isValidPosition,
  rotatePiece,
  lockPiece,
  clearLines,
  isGameOver,
  type Board,
  type Piece,
} from './TetrisEngine'
import { QuestionModal } from './QuestionModal'
import { GameOver } from './GameOver'
import { LevelBanner } from './LevelBanner'
import { MobileControls } from './MobileControls'
import { useTouchControls } from '@/hooks/useTouchControls'
import { calculerPointsReponse, calculerPointsLignes } from '@/lib/scoring'
import type { QuestionData, NiveauData } from '@/types'

const CELL_SIZES = { mobile: 24, tablet: 28, desktop: 30 }

function getCellSize(): number {
  if (typeof window === 'undefined') return CELL_SIZES.desktop
  if (window.innerWidth < 640) return CELL_SIZES.mobile
  if (window.innerWidth < 1024) return CELL_SIZES.tablet
  return CELL_SIZES.desktop
}

const COLORS = [
  '#1a1a2e', // 0 = empty
  '#06b6d4', // 1 = I (cyan)
  '#eab308', // 2 = O (yellow)
  '#a855f7', // 3 = T (purple)
  '#22c55e', // 4 = S (green)
  '#ef4444', // 5 = Z (red)
  '#3b82f6', // 6 = J (blue)
  '#f97316', // 7 = L (orange)
]

function drawBoard(ctx: CanvasRenderingContext2D, board: Board, cell: number) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = COLORS[board[r][c]] ?? COLORS[0]
      ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2)
    }
  }
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, cell: number, ghost = false) {
  ctx.globalAlpha = ghost ? 0.25 : 1
  ctx.fillStyle = COLORS[piece.color]
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue
      ctx.fillRect((piece.x + c) * cell + 1, (piece.y + r) * cell + 1, cell - 2, cell - 2)
    }
  }
  ctx.globalAlpha = 1
}

function ghostPiece(board: Board, piece: Piece): Piece {
  let ghost = { ...piece }
  while (isValidPosition(board, ghost, 0, 1)) {
    ghost = { ...ghost, y: ghost.y + 1 }
  }
  return ghost
}

export interface TetrisHandlers {
  moveLeft: () => void
  moveRight: () => void
  rotate: () => void
  softDrop: () => void
  hardDrop: () => void
}

interface Props {
  niveau: NiveauData
  questions: QuestionData[]
  onScoreSaved?: () => void
  onVictory?: (niveauId: number) => void
}

type GameStatus = 'playing' | 'question' | 'gameover' | 'victory'

export function TetrisBoard({ niveau, questions, onScoreSaved, onVictory }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cellSizeRef = useRef(getCellSize())

  const boardRef = useRef<Board>(createEmptyBoard())
  const currentRef = useRef<Piece>(randomPiece())
  const nextRef = useRef<Piece>(randomPiece())
  const scoreRef = useRef(0)
  const blocsRef = useRef(0)
  const blocsSinceQuestionRef = useRef(0)
  const linesRef = useRef(0)
  const questionIndexRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastTickRef = useRef(0)
  const statusRef = useRef<GameStatus>('playing')
  const questionStartTimeRef = useRef(0)

  // Re-render state
  const [score, setScore] = useState(0)
  const [showBonus, setShowBonus] = useState<number | null>(null)
  const [blocsPlaces, setBlocsPlaces] = useState(0)
  const [lines, setLines] = useState(0)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [nextPiece, setNextPiece] = useState<Piece>(nextRef.current)
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null)
  const [reussi, setReussi] = useState(false)
  const [cellSize, setCellSize] = useState(getCellSize())

  const orderedQuestions = useRef<QuestionData[]>([])

  const resetGame = useCallback(() => {
    orderedQuestions.current = questions
    boardRef.current = createEmptyBoard()
    currentRef.current = randomPiece()
    nextRef.current = randomPiece()
    scoreRef.current = 0
    blocsRef.current = 0
    blocsSinceQuestionRef.current = 0
    linesRef.current = 0
    questionIndexRef.current = 0
    lastTickRef.current = 0
    statusRef.current = 'playing'

    setScore(0)
    setBlocsPlaces(0)
    setLines(0)
    setStatus('playing')
    setNextPiece(nextRef.current)
    setCurrentQuestion(null)
    setReussi(false)
  }, [questions])

  useEffect(() => {
    orderedQuestions.current = questions
  }, [questions])

  // ResizeObserver for adaptive canvas
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const size = getCellSize()
      cellSizeRef.current = size
      setCellSize(size)
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = COLS * size
        canvas.height = ROWS * size
      }
    })
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cell = cellSizeRef.current

    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid lines
    ctx.strokeStyle = '#1e1e2e'
    ctx.lineWidth = 0.5
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * cell)
      ctx.lineTo(COLS * cell, r * cell)
      ctx.stroke()
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath()
      ctx.moveTo(c * cell, 0)
      ctx.lineTo(c * cell, ROWS * cell)
      ctx.stroke()
    }

    drawBoard(ctx, boardRef.current, cell)

    const current = currentRef.current
    const ghost = ghostPiece(boardRef.current, current)
    drawPiece(ctx, ghost, cell, true)
    drawPiece(ctx, current, cell)
  }, [])

  const lockAndProceed = useCallback(async () => {
    const board = lockPiece(boardRef.current, currentRef.current)
    const { board: clearedBoard, linesCleared } = clearLines(board)
    boardRef.current = clearedBoard

    blocsRef.current += 1
    const lineScore = calculerPointsLignes(linesCleared)
    scoreRef.current += lineScore
    linesRef.current += linesCleared

    setScore(scoreRef.current)
    setBlocsPlaces(blocsRef.current)
    setLines(linesRef.current)

    // Advance piece
    currentRef.current = nextRef.current
    nextRef.current = randomPiece()
    setNextPiece(nextRef.current)

    // Check game over
    if (isGameOver(clearedBoard, currentRef.current)) {
      statusRef.current = 'gameover'
      setStatus('gameover')
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niveauId: niveau.id,
          score: scoreRef.current,
          blocsPlaces: blocsRef.current,
          reussi: false,
        }),
      })
      onScoreSaved?.()
      return
    }

    // Trigger question every N blocs (dedicated counter to avoid modulo skip)
    blocsSinceQuestionRef.current += 1
    if (blocsSinceQuestionRef.current >= BLOCS_AVANT_QUESTION) {
      blocsSinceQuestionRef.current = 0
      statusRef.current = 'question'
      setStatus('question')
      const qi = questionIndexRef.current % orderedQuestions.current.length
      setCurrentQuestion(orderedQuestions.current[qi])
      questionIndexRef.current += 1
      questionStartTimeRef.current = Date.now()
    }
  }, [niveau, onScoreSaved])

  const tick = useCallback(
    (timestamp: number) => {
      if (statusRef.current !== 'playing') return

      const speed = niveau.vitesse
      if (timestamp - lastTickRef.current >= speed) {
        lastTickRef.current = timestamp

        if (isValidPosition(boardRef.current, currentRef.current, 0, 1)) {
          currentRef.current = { ...currentRef.current, y: currentRef.current.y + 1 }
        } else {
          lockAndProceed()
        }
      }

      draw()
      rafRef.current = requestAnimationFrame(tick)
    },
    [niveau.vitesse, lockAndProceed, draw]
  )

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  // Game action handlers (exposed for mobile controls)
  const handlers: TetrisHandlers = {
    moveLeft: () => {
      if (statusRef.current !== 'playing') return
      const p = currentRef.current
      if (isValidPosition(boardRef.current, p, -1, 0)) {
        currentRef.current = { ...p, x: p.x - 1 }
      }
    },
    moveRight: () => {
      if (statusRef.current !== 'playing') return
      const p = currentRef.current
      if (isValidPosition(boardRef.current, p, 1, 0)) {
        currentRef.current = { ...p, x: p.x + 1 }
      }
    },
    rotate: () => {
      if (statusRef.current !== 'playing') return
      const p = currentRef.current
      const rotated = rotatePiece(p.shape)
      if (isValidPosition(boardRef.current, p, 0, 0, rotated)) {
        currentRef.current = { ...p, shape: rotated }
      }
    },
    softDrop: () => {
      if (statusRef.current !== 'playing') return
      const p = currentRef.current
      if (isValidPosition(boardRef.current, p, 0, 1)) {
        currentRef.current = { ...p, y: p.y + 1 }
        // no points for soft drop
      } else {
        lockAndProceed()
      }
    },
    hardDrop: () => {
      if (statusRef.current !== 'playing') return
      const p = currentRef.current
      const ghost = ghostPiece(boardRef.current, p)
      currentRef.current = ghost
      lockAndProceed()
    },
  }

  // Touch controls for mobile
  useTouchControls(canvasRef, handlers, statusRef.current === 'playing')

  // Keyboard controls
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (statusRef.current !== 'playing') return

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault()
          handlers.moveLeft()
          break
        case 'ArrowRight':
          e.preventDefault()
          handlers.moveRight()
          break
        case 'ArrowDown':
          e.preventDefault()
          handlers.softDrop()
          break
        case 'ArrowUp':
        case 'KeyX':
          e.preventDefault()
          handlers.rotate()
          break
        case 'Space':
          e.preventDefault()
          handlers.hardDrop()
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lockAndProceed])

  async function handleCorrect() {
    const tempsMs = Date.now() - questionStartTimeRef.current
    const points = calculerPointsReponse(true, tempsMs)
    scoreRef.current += points
    setScore(scoreRef.current)
    setShowBonus(points)
    setTimeout(() => setShowBonus(null), 1500)

    setCurrentQuestion(null)

    if (questionIndexRef.current >= orderedQuestions.current.length) {
      cancelAnimationFrame(rafRef.current)
      statusRef.current = 'gameover'
      setStatus('gameover')
      setReussi(true)
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niveauId: niveau.id,
          score: scoreRef.current,
          blocsPlaces: blocsRef.current,
          reussi: true,
        }),
      })
      onVictory?.(niveau.id)
      onScoreSaved?.()
      return
    }

    statusRef.current = 'playing'
    setStatus('playing')
    lastTickRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }

  async function handleWrong() {
    setCurrentQuestion(null)
    statusRef.current = 'gameover'
    setStatus('gameover')
    cancelAnimationFrame(rafRef.current)
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        niveauId: niveau.id,
        score: scoreRef.current,
        blocsPlaces: blocsRef.current,
        reussi: false,
      }),
    })
    onScoreSaved?.()
  }

  function handleRestart() {
    cancelAnimationFrame(rafRef.current)
    resetGame()
    setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick)
    }, 50)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center lg:items-start justify-center p-2 lg:p-6">
      <div className="relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={COLS * cellSize}
          height={ROWS * cellSize}
          className="rounded-2xl border border-white/10 shadow-2xl shadow-black/30 mx-auto lg:mx-0"
          style={{ touchAction: 'none', userSelect: 'none' }}
        />
        {showBonus !== null && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
            style={{ animation: 'bonusFade 1.5s ease-out forwards' }}
          >
            <span className="text-4xl font-black text-yellow-400 drop-shadow-lg">
              +{showBonus} pts !
            </span>
          </div>
        )}
        {status === 'gameover' && (
          <GameOver
            score={score}
            blocsPlaces={blocsPlaces}
            reussi={reussi}
            niveauTitre={niveau.titre}
            onRestart={handleRestart}
            onHome={() => (window.location.href = '/play')}
          />
        )}
        {status === 'question' && currentQuestion && (
          <QuestionModal
            question={currentQuestion}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}
      </div>

      {/* Info panel: row on mobile, column on desktop */}
      <div className="w-full lg:w-52 flex flex-row lg:flex-col gap-3 lg:gap-4 justify-center flex-wrap">
        <LevelBanner
          niveau={niveau}
          score={score}
          blocsPlaces={blocsPlaces}
          lines={lines}
          nextPieceShape={nextPiece.shape}
          nextPieceColor={nextPiece.color}
        />
      </div>

      {/* Mobile controls — visible only on mobile/tablet */}
      <MobileControls handlers={handlers} />
    </div>
  )
}

export type { Props as TetrisBoardProps }
