export const SCORING = {
  REPONSE_CORRECTE: 200,
  REPONSE_RAPIDE_5S: 350,
  REPONSE_RAPIDE_10S: 275,
  PIECE_POSEE: 5,
  LIGNES: [0, 20, 60, 120, 200],
  HARD_DROP_PAR_CASE: 2,
} as const

export function calculerPointsReponse(correcte: boolean, tempsMs: number): number {
  if (!correcte) return 0
  if (tempsMs < 5000) return SCORING.REPONSE_RAPIDE_5S
  if (tempsMs < 10000) return SCORING.REPONSE_RAPIDE_10S
  return SCORING.REPONSE_CORRECTE
}

export function calculerPointsLignes(nbLignes: number): number {
  return SCORING.LIGNES[nbLignes] ?? 0
}
