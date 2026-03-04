// Pure Tetris game logic — no React dependency

export const COLS = 10
export const ROWS = 20
export const BLOCS_AVANT_QUESTION = 5

// Tetromino shapes
export const TETROMINOES = [
  // I
  { shape: [[1, 1, 1, 1]], color: 1 },
  // O
  { shape: [[1, 1], [1, 1]], color: 2 },
  // T
  { shape: [[0, 1, 0], [1, 1, 1]], color: 3 },
  // S
  { shape: [[0, 1, 1], [1, 1, 0]], color: 4 },
  // Z
  { shape: [[1, 1, 0], [0, 1, 1]], color: 5 },
  // J
  { shape: [[1, 0, 0], [1, 1, 1]], color: 6 },
  // L
  { shape: [[0, 0, 1], [1, 1, 1]], color: 7 },
]

export type Board = number[][]

export interface Piece {
  shape: number[][]
  color: number
  x: number
  y: number
}

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
}

export function randomPiece(): Piece {
  const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)]
  return {
    shape: t.shape,
    color: t.color,
    x: Math.floor(COLS / 2) - Math.floor(t.shape[0].length / 2),
    y: 0,
  }
}

export function isValidPosition(board: Board, piece: Piece, dx = 0, dy = 0, newShape?: number[][]): boolean {
  const shape = newShape ?? piece.shape
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) continue
      const nx = piece.x + col + dx
      const ny = piece.y + row + dy
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false
      if (ny >= 0 && board[ny][nx]) return false
    }
  }
  return true
}

export function rotatePiece(shape: number[][]): number[][] {
  const rows = shape.length
  const cols = shape[0].length
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c]
    }
  }
  return rotated
}

export function lockPiece(board: Board, piece: Piece): Board {
  const newBoard = board.map((row) => [...row])
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (!piece.shape[row][col]) continue
      const nx = piece.x + col
      const ny = piece.y + row
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
        newBoard[ny][nx] = piece.color
      }
    }
  }
  return newBoard
}

export interface ClearResult {
  board: Board
  linesCleared: number
}

export function clearLines(board: Board): ClearResult {
  const newBoard = board.filter((row) => row.some((cell) => cell === 0))
  const linesCleared = ROWS - newBoard.length
  const emptyRows = Array.from({ length: linesCleared }, () => Array(COLS).fill(0))
  return { board: [...emptyRows, ...newBoard], linesCleared }
}

export function calcScore(linesCleared: number, niveau: number): number {
  const base = [0, 100, 300, 500, 800]
  return (base[linesCleared] ?? 0) * niveau
}

export function isGameOver(board: Board, piece: Piece): boolean {
  return !isValidPosition(board, piece)
}
