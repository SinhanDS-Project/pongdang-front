'use client'
import { useEffect, useState } from 'react'

type Particle = { dx: string; dy: string; color: string }
type Burst = { id: number; x: number; y: number; particles: Particle[] }

export default function Fireworks() {
  const [bursts, setBursts] = useState<Burst[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now()
      const x = Math.random() * 100
      const y = Math.random() * 80
      const colors = ['#FF5733', '#FFD700', '#33FF57', '#3380FF', '#FF33B8']

      // 파티클 20개 생성
      const particles = Array.from({ length: 20 }).map(() => ({
        dx: (Math.random() - 0.5) * 400 + 'px', // 좌우로 크게 확산
        dy: (Math.random() - 0.5) * 400 + 'px', // 위아래로 크게 확산
        color: colors[Math.floor(Math.random() * colors.length)],
      }))

      setBursts((prev) => [...prev, { id, x, y, particles }])

      // 1.5초 후 제거
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id))
      }, 1500)
    }, 700)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {bursts.map((b) =>
        b.particles.map((p, idx) => (
          <span
            key={`${b.id}-${idx}`}
            className="firework-particle"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              backgroundColor: p.color,
              ['--x' as any]: p.dx,
              ['--y' as any]: p.dy,
            }}
          />
        )),
      )}
    </div>
  )
}
