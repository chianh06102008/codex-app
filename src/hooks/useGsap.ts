'use client'

import gsap from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Protects headers & status bands from phone Dynamic Island / front camera cutouts (~48px top center)
 */
export function useCameraSafeTopInset(): number {
  const [topInset, setTopInset] = useState<number>(52)

  useEffect(() => {
    const update = () => {
      setTopInset(window.innerWidth < 768 ? 52 : 18)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return topInset
}

export function useGsapScreenEntrance(deps: unknown[] = []) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0.9, y: 8 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power3.out', clearProps: 'transform' },
      )

      const cards = el.querySelectorAll('[data-gsap="stagger"]')
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            stagger: 0.03,
            ease: 'power2.out',
            clearProps: 'transform',
          },
        )
      }
    }, el)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return containerRef
}

export function useGsapSheetEntrance(isOpen = true) {
  const sheetRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const el = sheetRef.current
    if (!isOpen || !el || prefersReducedMotion()) return

    const tween = gsap.fromTo(
      el,
      { y: 24, opacity: 0.88 },
      { y: 0, opacity: 1, duration: 0.24, ease: 'expo.out', clearProps: 'transform' },
    )
    return () => {
      tween.kill()
    }
  }, [isOpen])

  return sheetRef
}

export function useGsapPulse(active = true) {
  const dotRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const el = dotRef.current
    if (!el || !active || prefersReducedMotion()) return

    const tween = gsap.to(el, {
      scale: 1.32,
      opacity: 0.55,
      duration: 0.75,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
    return () => {
      tween.kill()
      gsap.set(el, { scale: 1, opacity: 1 })
    }
  }, [active])

  return dotRef
}
