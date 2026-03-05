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
  joueurBloque: string | null
  explication: string | null
  scores: ScoreEntry[]
}

export function useMultiGame(salleId: string) {
  const [state, setState] = useState<MultiGameState>({
    joueurs: [],
    started: false,
    question: null,
    showLeverMain: false,
    joueurQuiRepond: null,
    joueurBloque: null,
    explication: null,
    scores: [],
  })

  const resetQuestion = useCallback(() => {
    setState((s) => ({
      ...s,
      question: null,
      showLeverMain: false,
      joueurQuiRepond: null,
      joueurBloque: null,
      explication: null,
    }))
  }, [])

  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe(`salle-${salleId}`)

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
        joueurBloque: null,
        explication: null,
      }))
    })

    channel.bind('main-levee', (data: { joueurNom: string }) => {
      setState((s) => ({
        ...s,
        joueurQuiRepond: data.joueurNom,
        showLeverMain: false,
      }))
    })

    channel.bind('reponse-correcte', (data: { joueurNom: string; explication: string | null; scores: ScoreEntry[] }) => {
      setState((s) => ({
        ...s,
        explication: data.explication,
        scores: data.scores,
      }))
      // Resume game after 2s
      setTimeout(() => {
        resetQuestion()
      }, 2000)
    })

    channel.bind('reponse-incorrecte', (data: { joueurNom: string }) => {
      setState((s) => ({
        ...s,
        joueurBloque: data.joueurNom,
        joueurQuiRepond: null,
        showLeverMain: true,
      }))
    })

    return () => {
      pusher.unsubscribe(`salle-${salleId}`)
    }
  }, [salleId, resetQuestion])

  return { ...state, resetQuestion }
}
