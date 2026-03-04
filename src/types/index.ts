export interface QuestionData {
  id: number
  texte: string
  choix: string[]
  bonneReponse: number
  explication: string | null
  niveauId: number
}

export interface NiveauData {
  id: number
  numero: number
  titre: string
  description: string | null
  vitesse: number
}

export interface ScoreData {
  id: number
  userId: string
  niveauId: number
  score: number
  blocsPlaces: number
  reussi: boolean
  createdAt: string
  user: { nom: string }
  niveau: { titre: string; numero: number }
}

export type GameStatus = 'idle' | 'playing' | 'question' | 'gameover' | 'victory'

export interface TetrisState {
  board: number[][]
  currentPiece: Piece | null
  nextPiece: Piece | null
  score: number
  blocsPlaces: number
  lines: number
  status: GameStatus
}

export interface Piece {
  shape: number[][]
  color: number
  x: number
  y: number
}
