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
import { SCORING, calculerPointsLignes } from '@/lib/scoring'
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

export default function MultiPlayPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [salleId, setSalleId] = useState<string | null>(null)
  const [niveauId, setNiveauId] = useState(1)
  const [niveauVitesse, setNiveauVitesse] = useState(500)
  const [niveauNumero, setNiveauNumero] = useState(1)
  const [cellSize, setCellSize] = useState(getCellSize())

  // Load salle info
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/multi/salle/${code}`)
      if (res.ok) {
        const data = await res.json()
        setSalleId(data.id)
        setNiveauId(data.niveauId)
        setNiveauNumero(data.niveau.numero)
        // Speed based on level
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

  const [score, setScore] = useState(0)
  const [blocsPlaces, setBlocsPlaces] = useState(0)
  const [isBloque, setIsBloque] = useState(false)
  const [timer, setTimer] = useState(30)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Pause game when question appears
  useEffect(() => {
    if (multi.question) {
      pausedRef.current = true
      setTimer(30)
      // Start 30s timer
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            // Time's up - resume
            if (timerRef.current) clearInterval(timerRef.current)
            multi.resetQuestion()
            pausedRef.current = false
            return 30
          }
          return t - 1
        })
      }, 1000)
    } else {
      pausedRef.current = false
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [multi.question, multi.resetQuestion])

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
    const lineScore = calculerPointsLignes(linesCleared)
    scoreRef.current += SCORING.PIECE_POSEE + lineScore

    setScore(scoreRef.current)
    setBlocsPlaces(blocsRef.current)

    currentRef.current = nextRef.current
    nextRef.current = randomPiece()

    if (isGameOver(clearedBoard, currentRef.current)) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    // Trigger question every N blocs via API
    if (blocsRef.current > 0 && blocsRef.current % BLOCS_AVANT_QUESTION === 0 && salleId) {
      fetch('/api/multi/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salleId, niveauId }),
      })
    }
  }, [niveauNumero, niveauId, salleId])

  const tick = useCallback(
    (timestamp: number) => {
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
        scoreRef.current += 1
        setScore(scoreRef.current)
      }
    },
    hardDrop: () => {
      if (pausedRef.current) return
      const p = currentRef.current
      const ghost = ghostPiece(boardRef.current, p)
      scoreRef.current += (ghost.y - p.y) * SCORING.HARD_DROP_PAR_CASE
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

  async function handleLeverMain() {
    if (!salleId) return
    const res = await fetch('/api/multi/lever-main', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salleId }),
    })
    if (res.status === 403) setIsBloque(true)
  }

  async function handleRepondre(index: number) {
    if (!salleId || !multi.question) return
    await fetch('/api/multi/repondre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salleId,
        reponseIndex: index,
        questionId: multi.question.id,
      }),
    })
  }

  const userId = session?.user?.id ?? ''
  const isRespondeur = multi.joueurRepondId === userId && multi.joueurRepondId !== null

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

      {/* Question Modal */}
      {multi.question && (
        <QuestionMulti
          question={multi.question}
          showLeverMain={multi.showLeverMain}
          joueurQuiRepond={multi.joueurQuiRepond}
          joueurBloque={multi.joueurBloque}
          explication={multi.explication}
          isBloque={isBloque}
          isRespondeur={isRespondeur}
          onLeverMain={handleLeverMain}
          onRepondre={handleRepondre}
          timerSeconds={timer}
        />
      )}
    </div>
  )
}
