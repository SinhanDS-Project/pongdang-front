'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/net/client-axios'
import { AxiosError } from 'axios'

type AttendanceMap = Record<number, boolean>

export default function AttendancePage() {
  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  //  월요일 시작 기준 보정
  const rawFirstDay = new Date(year, month, 1).getDay() // 0=일~6=토
  const firstDay = (rawFirstDay + 6) % 7 // 월=0, 화=1, ..., 일=6

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const [attendance, setAttendance] = useState<AttendanceMap>({})
  const [rewardMsg, setRewardMsg] = useState('')
  const [subMsg, setSubMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const dateStr = (y: number, m1: number, d: number) =>
    `${y}-${String(m1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  //  서버에서 출석 기록 불러오기
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
          setRewardMsg('오늘 이미 출석체크를 완료했습니다. ✅')
          setSubMsg('이미 1퐁이 적립되었습니다.')
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [year, month, today])

  //  오늘 출석하기
  const handleCheck = async (day: number) => {
    if (day !== today) return
    if (attendance[day]) return
    if (loading) return

    setLoading(true)
    setRewardMsg('')
    setSubMsg('')

    try {
      const payload = {
        year,
        month: month + 1,
        day,
        date: dateStr(year, month + 1, day),
      }

      await api.post('/api/attendance', payload)

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
        setRewardMsg('출석 저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-16 text-center text-2xl font-bold">📅 퐁당퐁당 출석체크 ✔️</h1>
      <p className="mb-8 text-center text-2xl font-bold text-gray-700">
        {year}년 {month + 1}월
      </p>

      <div className="grid grid-cols-7 gap-3 text-center text-lg">
        {/*  요일 헤더 (월요일 시작) */}
        {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
          <div key={d} className="font-semibold text-gray-700">
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
                'flex h-16 w-16 items-center justify-center rounded-lg border text-lg font-semibold transition',

                checked
                  ? isToday
                    ? 'cursor-default bg-sky-600 text-white shadow-md' // 오늘 출석 완료
                    : 'cursor-default bg-sky-300 text-white shadow-sm' // 과거 출석
                  : isToday
                    ? 'border-2 border-blue-500 bg-white text-blue-600 hover:scale-105 hover:bg-blue-50'
                    : 'cursor-not-allowed border-gray-300 text-gray-400 opacity-60', // 다른 날짜
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* 안내/메시지 */}
      <div className="mt-8 text-center">
        {rewardMsg && (
          <>
            <p className="mb-2 text-xl font-bold text-green-600">{rewardMsg}</p>
            {subMsg && <p className="text-lg text-gray-700">{subMsg}</p>}
          </>
        )}
      </div>
    </main>
  )
}
