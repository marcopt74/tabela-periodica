import { useEffect, useRef } from 'react'

const COLORS = ['#ff8d7a', '#ffbf3c', '#3ecfb8', '#5eb0f0', '#b09af5', '#4dcc86', '#f27aaa', '#f5a35a']

type Bit = {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  rot: number
  vr: number
  color: string
}

export function Confetti({ token }: { token: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (token === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const bits: Bit[] = Array.from({ length: 90 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI
      const speed = 6 + Math.random() * 8
      return {
        x: width * (0.35 + Math.random() * 0.3),
        y: height * 0.38,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0],
      }
    })

    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const elapsed = now - start
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)
      for (const bit of bits) {
        bit.vy += 0.16
        bit.x += bit.vx
        bit.y += bit.vy
        bit.rot += bit.vr
        context.save()
        context.translate(bit.x, bit.y)
        context.rotate(bit.rot)
        context.globalAlpha = Math.max(0, 1 - elapsed / 1700)
        context.fillStyle = bit.color
        context.fillRect(-bit.w / 2, -bit.h / 2, bit.w, bit.h)
        context.restore()
      }
      if (elapsed < 1800) frame = requestAnimationFrame(tick)
      else context.clearRect(0, 0, width, height)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [token])

  return <canvas ref={ref} className="confetti" aria-hidden="true" />
}
