'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useVerifyTimer(initial = 60) {
  const [seconds, setSeconds] = useState(0)
  const [cooldown, setCooldown] = useState(0) // 재전송 쿨다운(선택)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const cdRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(
    (sec = initial) => {
      if (timerRef.current) clearInterval(timerRef.current)
      setSeconds(sec)
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return s - 1
        })
      }, 1000)
    },
    [initial],
  )

  const startCooldown = useCallback((sec = 30) => {
    if (cdRef.current) clearInterval(cdRef.current)
    setCooldown(sec)
    cdRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (cdRef.current) clearInterval(cdRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }, [])

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSeconds(0)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (cdRef.current) clearInterval(cdRef.current)
    },
    [],
  )

  return {
    seconds, // 남은 인증 유효시간
    cooldown, // 재전송 남은 시간
    running: seconds > 0,
    canResend: cooldown === 0,
    start, // 인증요청 시 start(60)
    startCooldown, // 인증요청 후 재전송 쿨다운 start(30)
    reset,
  }
}
