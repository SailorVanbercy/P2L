'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPusherClient } from '@/lib/pusherClient'

interface QuestionMultiData {
  id: number
  texte: string
  choix: string[]
  niveauId: number
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
  showLeverMain: boolean
  joueurQuiRepond: string | null
  joueurRepondId: string | null
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
    showLeverMain: false,
    joueurQuiRepond: null,
    joueurRepondId: null,
    joueurBloque: null,
    explication: null,
    scores: [],
    pusherReady: false,
  })

  const resetQuestion = useCallback(() => {
    setState((s) => ({
      ...s,
      question: null,
      showLeverMain: false,
      joueurQuiRepond: null,
      joueurRepondId: null,
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
        showLeverMain: true,
        joueurQuiRepond: null,
        joueurRepondId: null,
        joueurBloque: null,
        explication: null,
      }))
    })

    channel.bind('main-levee', (data: {
      joueurNom: string
      joueurId: string
      question: QuestionMultiData | null
    }) => {
      setState((s) => ({
        ...s,
        joueurQuiRepond: data.joueurNom,
        joueurRepondId: data.joueurId,
        showLeverMain: false,
        question: data.question ?? s.question,
      }))
    })

    channel.bind('reponse-correcte', (data: { joueurNom: string; explication: string | null; scores: ScoreEntry[] }) => {
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
        joueurQuiRepond: null,
        joueurRepondId: null,
        showLeverMain: true,
      }))
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`salle-${salleId}`)
    }
  }, [salleId, resetQuestion])

  return { ...state, resetQuestion }
}
