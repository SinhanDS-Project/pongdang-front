'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/net/client-axios'
import { AxiosError } from 'axios'

type AttendanceMap = Record<number, boolean>

export default function AttendancePage() {
  // 오늘 날짜 (CSR 전용이라 hydration mismatch X)
  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  // 월요일 시작 기준 보정
  const rawFirstDay = new Date(year, month, 1).getDay() // 0=일~6=토
  const firstDay = (rawFirstDay + 6) % 7 // 월=0, ..., 일=6

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const [attendance, setAttendance] = useState<AttendanceMap>({})
  const [rewardMsg, setRewardMsg] = useState('')
  const [subMsg, setSubMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const dateStr = (y: number, m1: number, d: number) =>
    `${y}-${String(m1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  // 서버에서 출석 기록 불러오기
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/api/attendance', {
          params: { year, month: month + 1 },
        })
        const map: AttendanceMap = {}
        ;(data?.attendance_date ?? []).forEach((dateStr: string) => {
          const parts = dateStr.split('-')
          if (parts.length === 3) {
            const day = Number(parts[2])
            if (!isNaN(day)) map[day] = true
          }
        })
        setAttendance(map)

        if (map[today]) {
          setRewardMsg('오늘 출석체크를 완료했습니다. ✅')
          setSubMsg('이미 1퐁이 적립되었습니다.')
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [year, month, today])

  // 오늘 출석하기
  const handleCheck = async (day: number) => {
    if (day !== today) return
    if (attendance[day]) return
    if (loading) return

    setLoading(true)
    setRewardMsg('')
    setSubMsg('')

    try {
      await api.put('/api/wallet/add', {
        amount: 1,
        wallet_type: 'PONG',
        event_type: 'ATTENDANCE',
      })

      setAttendance((prev) => ({ ...prev, [day]: true }))
      setRewardMsg('오늘의 출석체크가 완료되었습니다. ✅')
      setSubMsg('🎉 축하합니다! 1퐁이 적립되었습니다.')
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as AxiosError).response?.status === 409
      ) {
        setAttendance((prev) => ({ ...prev, [day]: true }))
        setRewardMsg('오늘 이미 출석체크를 완료했습니다. ✅')
        setSubMsg('이미 1퐁이 적립되었습니다.')
      } else {
        console.error(err)
        setRewardMsg('출석 저장/적립에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="mb-8 text-center text-xl font-bold sm:mb-16 sm:text-2xl">📅 퐁당퐁당 출석체크 ✔️</h1>
      <p className="mb-6 text-center text-xl font-bold text-gray-700 sm:mb-8 sm:text-2xl">
        {year}년 {month + 1}월
      </p>

      {/* 달력 */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm sm:gap-3 sm:text-lg">
        {/* 요일 헤더 */}
        {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
          <div
            key={d}
            className={`font-semibold ${i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : 'text-gray-700'}`}
          >
            {d}
          </div>
        ))}

        {/* 첫째날 전 공백 */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* 날짜 버튼 */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isToday = day === today
          const checked = !!attendance[day]

          return (
            <button
              key={day}
              onClick={() => handleCheck(day)}
              disabled={checked || loading || !isToday}
              className={[
                'flex items-center justify-center rounded-lg border font-semibold transition',
                'h-10 w-10 text-sm', // 모바일
                'sm:h-16 sm:w-16 sm:text-lg', // 태블릿 이상
                checked
                  ? isToday
                    ? 'cursor-default bg-sky-600 text-white shadow-md'
                    : 'cursor-default bg-sky-300 text-white shadow-sm'
                  : isToday
                    ? 'border-2 border-blue-500 bg-white text-blue-600 hover:scale-105 hover:bg-blue-50'
                    : 'cursor-not-allowed border-gray-300 text-gray-400 opacity-60',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 text-center sm:mt-8">
        {rewardMsg && (
          <>
            <p className="mb-1 text-lg font-bold text-green-600 sm:mb-2 sm:text-xl">{rewardMsg}</p>
            {subMsg && <p className="text-sm text-gray-700 sm:text-lg">{subMsg}</p>}
          </>
        )}
      </div>
    </main>
  )
}
