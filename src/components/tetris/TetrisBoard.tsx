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
  calcScore,
  isGameOver,
  type Board,
  type Piece,
} from './TetrisEngine'
import { QuestionModal } from './QuestionModal'
import { GameOver } from './GameOver'
import { LevelBanner } from './LevelBanner'
import type { QuestionData, NiveauData } from '@/types'

const CELL = 32
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

function drawBoard(ctx: CanvasRenderingContext2D, board: Board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = COLORS[board[r][c]] ?? COLORS[0]
      ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2)
    }
  }
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, ghost = false) {
  ctx.globalAlpha = ghost ? 0.25 : 1
  ctx.fillStyle = COLORS[piece.color]
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue
      ctx.fillRect((piece.x + c) * CELL + 1, (piece.y + r) * CELL + 1, CELL - 2, CELL - 2)
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

interface Props {
  niveau: NiveauData
  questions: QuestionData[]
  onScoreSaved?: () => void
  onVictory?: (niveauId: number) => void
}

type GameStatus = 'playing' | 'question' | 'gameover' | 'victory'

export function TetrisBoard({ niveau, questions, onScoreSaved, onVictory }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const boardRef = useRef<Board>(createEmptyBoard())
  const currentRef = useRef<Piece>(randomPiece())
  const nextRef = useRef<Piece>(randomPiece())
  const scoreRef = useRef(0)
  const blocsRef = useRef(0)
  const linesRef = useRef(0)
  const questionIndexRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastTickRef = useRef(0)
  const statusRef = useRef<GameStatus>('playing')

  // Re-render state
  const [score, setScore] = useState(0)
  const [blocsPlaces, setBlocsPlaces] = useState(0)
  const [lines, setLines] = useState(0)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [nextPiece, setNextPiece] = useState<Piece>(nextRef.current)
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null)
  const [reussi, setReussi] = useState(false)

  const shuffledQuestions = useRef<QuestionData[]>([])

  const resetGame = useCallback(() => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    shuffledQuestions.current = shuffled
    boardRef.current = createEmptyBoard()
    currentRef.current = randomPiece()
    nextRef.current = randomPiece()
    scoreRef.current = 0
    blocsRef.current = 0
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

  // Initial shuffle
  useEffect(() => {
    shuffledQuestions.current = [...questions].sort(() => Math.random() - 0.5)
  }, [questions])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid lines
    ctx.strokeStyle = '#1e1e2e'
    ctx.lineWidth = 0.5
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * CELL)
      ctx.lineTo(COLS * CELL, r * CELL)
      ctx.stroke()
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath()
      ctx.moveTo(c * CELL, 0)
      ctx.lineTo(c * CELL, ROWS * CELL)
      ctx.stroke()
    }

    drawBoard(ctx, boardRef.current)

    const current = currentRef.current
    const ghost = ghostPiece(boardRef.current, current)
    drawPiece(ctx, ghost, true)
    drawPiece(ctx, current)
  }, [])

  const lockAndProceed = useCallback(async () => {
    let board = lockPiece(boardRef.current, currentRef.current)
    const { board: clearedBoard, linesCleared } = clearLines(board)
    boardRef.current = clearedBoard

    blocsRef.current += 1
    const lineScore = calcScore(linesCleared, niveau.numero)
    const pieceScore = 10 * niveau.numero
    scoreRef.current += pieceScore + lineScore
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
      // Save score
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

    // Trigger question every N blocs
    if (blocsRef.current > 0 && blocsRef.current % BLOCS_AVANT_QUESTION === 0) {
      statusRef.current = 'question'
      setStatus('question')
      const qi = questionIndexRef.current % shuffledQuestions.current.length
      setCurrentQuestion(shuffledQuestions.current[qi])
      questionIndexRef.current += 1
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

  // Keyboard controls
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (statusRef.current !== 'playing') return

      const p = currentRef.current
      const board = boardRef.current

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault()
          if (isValidPosition(board, p, -1, 0)) {
            currentRef.current = { ...p, x: p.x - 1 }
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (isValidPosition(board, p, 1, 0)) {
            currentRef.current = { ...p, x: p.x + 1 }
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (isValidPosition(board, p, 0, 1)) {
            currentRef.current = { ...p, y: p.y + 1 }
            scoreRef.current += 1
            setScore(scoreRef.current)
          } else {
            lockAndProceed()
          }
          break
        case 'ArrowUp':
        case 'KeyX': {
          e.preventDefault()
          const rotated = rotatePiece(p.shape)
          if (isValidPosition(board, p, 0, 0, rotated)) {
            currentRef.current = { ...p, shape: rotated }
          }
          break
        }
        case 'Space': {
          e.preventDefault()
          const ghost = ghostPiece(board, p)
          scoreRef.current += (ghost.y - p.y) * 2
          currentRef.current = ghost
          lockAndProceed()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lockAndProceed])

  async function handleCorrect() {
    setCurrentQuestion(null)

    // Victoire : toutes les questions ont été répondues correctement
    if (questionIndexRef.current >= shuffledQuestions.current.length) {
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
    // Save failed score
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
    <div className="flex items-start gap-6">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          className="rounded-xl border border-white/10 shadow-2xl"
        />
        {status === 'gameover' && (
          <GameOver
            score={score}
            blocsPlaces={blocsPlaces}
            reussi={reussi}
            niveauTitre={niveau.titre}
            onRestart={handleRestart}
            onHome={() => window.location.href = '/play'}
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

      <LevelBanner
        niveau={niveau}
        score={score}
        blocsPlaces={blocsPlaces}
        lines={lines}
        nextPieceShape={nextPiece.shape}
        nextPieceColor={nextPiece.color}
      />
    </div>
  )
}
