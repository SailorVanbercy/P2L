'use client'

import { useRef, useEffect } from 'react'
import type { TetrisHandlers } from '@/components/tetris/TetrisBoard'

const THRESHOLD = 30 // px minimum pour déclencher un swipe

export function useTouchControls(
  containerRef: React.RefObject<HTMLElement | null>,
  handlers: TetrisHandlers
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchStart.current) return

      const dx = e.changedTouches[0].clientX - touchStart.current.x
      const dy = e.changedTouches[0].clientY - touchStart.current.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (Math.max(absDx, absDy) < THRESHOLD) {
        // Tap = rotation
        handlers.rotate()
        touchStart.current = null
        return
      }

      if (absDx > absDy) {
        // Horizontal swipe
        if (dx > 0) {
          handlers.moveRight()
        } else {
          handlers.moveLeft()
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          handlers.softDrop()
        } else {
          handlers.rotate()
        }
      }

      touchStart.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [containerRef, handlers])
}
