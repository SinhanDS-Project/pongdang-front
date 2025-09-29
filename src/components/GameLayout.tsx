'use client'

import { useEffect, useState, type ReactNode } from 'react'

export default function GameLayout({ children }: { children: ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }
    window.addEventListener('resize', checkOrientation)
    checkOrientation()
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  return (
    <div className="bg-muted/40 h-dvh overflow-hidden relative">
      {isPortrait ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black text-white text-lg">
          📲 가로모드로 전환해주세요
        </div>
      ) : (
        <div className="flex h-full items-center justify-center p-4">
          {children}
        </div>
      )}
    </div>
  )
}
