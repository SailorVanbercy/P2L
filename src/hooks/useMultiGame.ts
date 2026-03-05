'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPusherClient } from '@/lib/pusherClient'

interface QuestionMultiData {
  id: number
  texte: string
  choix: string[]
  niveauId: number
  triggeredByUserId: string
}

interface ScoreEntry {
  joueurNom: string
  joueurId: string
  score: number
}

interface MultiGameState {
  joueurs: string[]
  started: boolean
  question: QuestionMultiData | null
  triggeredByUserId: string | null
  joueurBloque: string | null
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
    joueurBloque: null,
    explication: null,
    scores: [],
    pusherReady: false,
  })

  const resetQuestion = useCallback(() => {
    setState((s) => ({
      ...s,
      question: null,
      triggeredByUserId: null,
      joueurBloque: null,
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
        joueurBloque: null,
        explication: null,
      }))
    })

    channel.bind('reponse-correcte', (data: { joueurNom: string; explication: string | null; scores: ScoreEntry[]; points: number }) => {
      setState((s) => ({
        ...s,
        explication: data.explication,
        scores: data.scores,
      }))
      setTimeout(() => {
        resetQuestion()
      }, 2000)
    })

    channel.bind('reponse-incorrecte', (data: { joueurNom: string }) => {
      setState((s) => ({
        ...s,
        joueurBloque: data.joueurNom,
      }))
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`salle-${salleId}`)
    }
  }, [salleId, resetQuestion])

  return { ...state, resetQuestion }
}
