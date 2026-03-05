'use client'

import { useEffect, type RefObject } from 'react'

interface TouchHandlers {
  moveLeft: () => void
  moveRight: () => void
  softDrop: () => void
  rotate: () => void
  hardDrop: () => void
}

const THRESHOLD = 30
const TAP_MAX_DURATION = 200

export function useTouchControls(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  handlers: TouchHandlers,
  enabled: boolean
) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let startX = 0
    let startY = 0
    let startTime = 0

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startTime = Date.now()
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      if (!enabled) return

      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      const duration = Date.now() - startTime

      if (absDx < THRESHOLD && absDy < THRESHOLD) {
        if (duration < TAP_MAX_DURATION) handlers.rotate()
        return
      }

      if (absDx > absDy) {
        dx > 0 ? handlers.moveRight() : handlers.moveLeft()
      } else {
        dy > 0 ? handlers.softDrop() : handlers.rotate()
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [canvasRef, handlers, enabled])
}
