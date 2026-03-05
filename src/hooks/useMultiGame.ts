'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPusherClient } from '@/lib/pusherClient'

interface QuestionMultiData {
  id: number
  texte: string
  source: string | null
  choix: string[]
  niveauId: number
  triggeredByUserId: string
}

interface ScoreEntry {
  joueurNom: string
  joueurId: string
  score: number
}

interface ReponseJoueur {
  joueurNom: string
  joueurId: string
  correct: boolean
  points: number
  explication: string | null
}

interface MultiGameState {
  joueurs: string[]
  started: boolean
  question: QuestionMultiData | null
  triggeredByUserId: string | null
  reponses: ReponseJoueur[]
  explication: string | null
  scores: ScoreEntry[]
  pusherReady: boolean
}

export function useMultiGame(salleId: string) {
  const [state, setState] = useState<MultiGameState>({
    joueurs: [],
    started: false,
    question: null,
    triggeredByUserId: null,
    reponses: [],
    explication: null,
    scores: [],
    pusherReady: false,
  })

  const resetQuestion = useCallback(() => {
    setState((s) => ({
      ...s,
      question: null,
      triggeredByUserId: null,
      reponses: [],
      explication: null,
    }))
  }, [])

  useEffect(() => {
    if (!salleId) return

    const pusher = getPusherClient()
    const channel = pusher.subscribe(`salle-${salleId}`)

    channel.bind('pusher:subscription_succeeded', () => {
      setState((s) => ({ ...s, pusherReady: true }))
    })

    channel.bind('joueur-rejoint', (data: { joueurNom: string }) => {
      setState((s) => ({
        ...s,
        joueurs: [...s.joueurs, data.joueurNom],
      }))
    })

    channel.bind('partie-demarree', () => {
      setState((s) => ({ ...s, started: true }))
    })

    channel.bind('question-affichee', (data: QuestionMultiData) => {
      setState((s) => ({
        ...s,
        question: data,
        triggeredByUserId: data.triggeredByUserId,
        reponses: [],
        explication: null,
      }))
    })

    channel.bind('reponse-joueur', (data: ReponseJoueur & { scores: ScoreEntry[] }) => {
      setState((s) => ({
        ...s,
        reponses: [...s.reponses, {
          joueurNom: data.joueurNom,
          joueurId: data.joueurId,
          correct: data.correct,
          points: data.points,
          explication: data.explication,
        }],
        explication: data.explication ?? s.explication,
        scores: data.scores,
      }))
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`salle-${salleId}`)
    }
  }, [salleId, resetQuestion])

  return { ...state, resetQuestion }
}
