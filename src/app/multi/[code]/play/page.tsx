'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useMultiGame } from '@/hooks/useMultiGame'
import { MultiLeaderboard } from '@/components/multi/MultiLeaderboard'
import { QuestionMulti } from '@/components/multi/QuestionMulti'
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
} from '@/components/tetris/TetrisEngine'
import { MobileControls } from '@/components/tetris/MobileControls'
import { useTouchControls } from '@/hooks/useTouchControls'
import { calculerPointsLignes } from '@/lib/scoring'
import type { TetrisHandlers } from '@/components/tetris/TetrisBoard'

const CELL_SIZES = { mobile: 24, tablet: 28, desktop: 30 }
function getCellSize(): number {
  if (typeof window === 'undefined') return CELL_SIZES.desktop
  if (window.innerWidth < 640) return CELL_SIZES.mobile
  if (window.innerWidth < 1024) return CELL_SIZES.tablet
  return CELL_SIZES.desktop
}

const COLORS = [
  '#1a1a2e', '#06b6d4', '#eab308', '#a855f7',
  '#22c55e', '#ef4444', '#3b82f6', '#f97316',
]

const AVANTAGE_SECONDS = 3

export default function MultiPlayPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [salleId, setSalleId] = useState<string | null>(null)
  const [niveauId, setNiveauId] = useState(1)
  const [niveauVitesse, setNiveauVitesse] = useState(500)
  const [cellSize, setCellSize] = useState(getCellSize())

  // Load salle info
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/multi/salle/${code}`)
      if (res.ok) {
        const data = await res.json()
        setSalleId(data.id)
        setNiveauId(data.niveauId)
        setNiveauVitesse(Math.max(100, 600 - data.niveau.numero * 50))
      }
    }
    load()
  }, [code])

  const multi = useMultiGame(salleId ?? '')

  // Canvas and game state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cellSizeRef = useRef(getCellSize())
  const boardRef = useRef<Board>(createEmptyBoard())
  const currentRef = useRef<Piece>(randomPiece())
  const nextRef = useRef<Piece>(randomPiece())
  const scoreRef = useRef(0)
  const blocsRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastTickRef = useRef(0)
  const pausedRef = useRef(false)
  const gameOverRef = useRef(false)

  const [score, setScore] = useState(0)
  const [blocsPlaces, setBlocsPlaces] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [timer, setTimer] = useState(30)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 3-second advantage system
  const [canAnswer, setCanAnswer] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [localExplication, setLocalExplication] = useState<string | null>(null)

  // ResizeObserver
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

  const userId = session?.user?.id ?? ''

  // Pause game when question appears (global pause for all players)
  useEffect(() => {
    if (multi.question) {
      pausedRef.current = true
      setTimer(30)

      // 3-second advantage: triggerer can answer immediately, others wait
      const isTriggerer = multi.triggeredByUserId === userId
      if (isTriggerer) {
        setCanAnswer(true)
        setCountdown(0)
      } else {
        setCanAnswer(false)
        setCountdown(AVANTAGE_SECONDS)
        // Countdown for non-triggerers
        countdownRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current)
              countdownRef.current = null
              setCanAnswer(true)
              return 0
            }
            return c - 1
          })
        }, 1000)
      }

      // Start 30s global timer
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            // Clear currentQuestionId on server so next threshold can trigger
            if (salleId) {
              fetch('/api/multi/question-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salleId }),
              })
            }
            multi.resetQuestion()
            pausedRef.current = false
            setHasAnswered(false)
            setLocalExplication(null)
            return 30
          }
          return t - 1
        })
      }, 1000)
    } else {
      pausedRef.current = false
      setCanAnswer(false)
      setCountdown(0)
      setHasAnswered(false)
      setLocalExplication(null)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [multi.question, multi.resetQuestion, multi.triggeredByUserId, userId])

  function ghostPiece(board: Board, piece: Piece): Piece {
    let ghost = { ...piece }
    while (isValidPosition(board, ghost, 0, 1)) {
      ghost = { ...ghost, y: ghost.y + 1 }
    }
    return ghost
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cell = cellSizeRef.current

    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#1e1e2e'
    ctx.lineWidth = 0.5
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * cell); ctx.lineTo(COLS * cell, r * cell); ctx.stroke()
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * cell, 0); ctx.lineTo(c * cell, ROWS * cell); ctx.stroke()
    }

    // Board
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = COLORS[boardRef.current[r][c]] ?? COLORS[0]
        ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2)
      }
    }

    // Ghost + current
    const current = currentRef.current
    const ghost = ghostPiece(boardRef.current, current)
    ctx.globalAlpha = 0.25
    ctx.fillStyle = COLORS[ghost.color]
    for (let r = 0; r < ghost.shape.length; r++) {
      for (let c = 0; c < ghost.shape[r].length; c++) {
        if (!ghost.shape[r][c]) continue
        ctx.fillRect((ghost.x + c) * cell + 1, (ghost.y + r) * cell + 1, cell - 2, cell - 2)
      }
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = COLORS[current.color]
    for (let r = 0; r < current.shape.length; r++) {
      for (let c = 0; c < current.shape[r].length; c++) {
        if (!current.shape[r][c]) continue
        ctx.fillRect((current.x + c) * cell + 1, (current.y + r) * cell + 1, cell - 2, cell - 2)
      }
    }
  }, [])

  const lockAndProceed = useCallback(() => {
    const board = lockPiece(boardRef.current, currentRef.current)
    const { board: clearedBoard, linesCleared } = clearLines(board)
    boardRef.current = clearedBoard

    blocsRef.current += 1
    // Score: only line clears count (no per-piece bonus)
    const lineScore = calculerPointsLignes(linesCleared)
    scoreRef.current += lineScore

    setScore(scoreRef.current)
    setBlocsPlaces(blocsRef.current)

    currentRef.current = nextRef.current
    nextRef.current = randomPiece()

    if (isGameOver(clearedBoard, currentRef.current)) {
      gameOverRef.current = true
      setGameOver(true)
      cancelAnimationFrame(rafRef.current)
      if (salleId) {
        fetch('/api/multi/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salleId, score: scoreRef.current }),
        })
      }
      return
    }

    // Trigger question every N blocs
    if (blocsRef.current > 0 && blocsRef.current % BLOCS_AVANT_QUESTION === 0 && salleId) {
      fetch('/api/multi/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salleId, niveauId }),
      })
    }
  }, [niveauId, salleId])

  const tick = useCallback(
    (timestamp: number) => {
      if (gameOverRef.current) return

      if (pausedRef.current) {
        draw()
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (timestamp - lastTickRef.current >= niveauVitesse) {
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
    [niveauVitesse, lockAndProceed, draw]
  )

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  // Game handlers
  const handlers: TetrisHandlers = {
    moveLeft: () => {
      if (pausedRef.current) return
      const p = currentRef.current
      if (isValidPosition(boardRef.current, p, -1, 0)) {
        currentRef.current = { ...p, x: p.x - 1 }
      }
    },
    moveRight: () => {
      if (pausedRef.current) return
      const p = currentRef.current
      if (isValidPosition(boardRef.current, p, 1, 0)) {
        currentRef.current = { ...p, x: p.x + 1 }
      }
    },
    rotate: () => {
      if (pausedRef.current) return
      const p = currentRef.current
      const rotated = rotatePiece(p.shape)
      if (isValidPosition(boardRef.current, p, 0, 0, rotated)) {
        currentRef.current = { ...p, shape: rotated }
      }
    },
    softDrop: () => {
      if (pausedRef.current) return
      const p = currentRef.current
      if (isValidPosition(boardRef.current, p, 0, 1)) {
        currentRef.current = { ...p, y: p.y + 1 }
      }
    },
    hardDrop: () => {
      if (pausedRef.current) return
      const p = currentRef.current
      const ghost = ghostPiece(boardRef.current, p)
      currentRef.current = ghost
      lockAndProceed()
    },
  }

  // Touch controls for mobile
  useTouchControls(canvasRef, handlers, !pausedRef.current)

  // Keyboard controls
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      switch (e.code) {
        case 'ArrowLeft': e.preventDefault(); handlers.moveLeft(); break
        case 'ArrowRight': e.preventDefault(); handlers.moveRight(); break
        case 'ArrowDown': e.preventDefault(); handlers.softDrop(); break
        case 'ArrowUp': case 'KeyX': e.preventDefault(); handlers.rotate(); break
        case 'Space': e.preventDefault(); handlers.hardDrop(); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lockAndProceed])

  async function handleRepondre(index: number) {
    if (!salleId || !multi.question || hasAnswered) return
    setHasAnswered(true)
    const res = await fetch('/api/multi/repondre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salleId,
        reponseIndex: index,
        questionId: multi.question.id,
      }),
    })
    const data = await res.json()
    // Resume playing immediately after answering
    pausedRef.current = false
    // Show explication locally only if correct, auto-hide after 4s
    if (data.correct && data.explication) {
      setLocalExplication(data.explication)
      setTimeout(() => setLocalExplication(null), 4000)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f] px-3 py-3 lg:px-6 lg:py-6">
      <header className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-400">Salle: <span className="font-mono text-indigo-300">{code}</span></span>
        <span className="text-sm text-slate-400">Score: <span className="font-mono text-white">{score}</span></span>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start justify-center">
        {/* Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={COLS * cellSize}
            height={ROWS * cellSize}
            className="rounded-xl border border-white/10 shadow-2xl"
            style={{ touchAction: 'none', userSelect: 'none' }}
          />
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl">
              <p className="text-3xl font-black text-red-400 mb-2">Game Over</p>
              <p className="text-lg text-white mb-4">Score : {score}</p>
              <button
                onClick={() => router.push(`/multi/${code}`)}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-500"
              >
                Retour a la salle
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="w-full lg:w-56">
          <MultiLeaderboard scores={multi.scores} currentUserId={userId} />
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Blocs</div>
            <div className="text-xl font-bold text-white">{blocsPlaces}</div>
          </div>
        </div>

        {/* Mobile controls */}
        <MobileControls handlers={handlers} />
      </div>

      {/* Question Modal — hidden once the player has answered */}
      {multi.question && !hasAnswered && (
        <QuestionMulti
          question={multi.question}
          canAnswer={canAnswer}
          countdown={countdown}
          reponses={multi.reponses}
          onRepondre={handleRepondre}
          timerSeconds={timer}
        />
      )}

      {/* Explication banner — shown only to the player who answered correctly */}
      {localExplication && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-md rounded-xl border border-green-500/20 bg-green-500/10 px-5 py-3 text-sm text-green-300 shadow-xl">
          <span className="font-semibold">Bonne reponse ! </span>
          {localExplication}
        </div>
      )}
    </div>
  )
}
