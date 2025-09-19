'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, startTransition } from 'react'

import { Track } from '@components/turtle-run-page'

import { tokenStore } from '@lib/auth/token-store'
import { api } from '@lib/net/client-axios'
import { useTurtleSocket } from '@lib/socket' // ← onPlayers, onFinish 둘 다 여기서 처리

import { useAuthStore } from '@stores/auth-store'
import { useTurtleStore, COLOR_ORDER } from '@stores/turtle-store'
import { PodiumModal } from '@/components/turtle-run-page/PodiumModal'

export type Winner = {
  rank: 1 | 2 | 3
  name: string
  reward?: number
  avatarUrl?: string
  color?: 'blue' | 'green' | 'red'
}

type Difficulty = 'EASY' | 'NORMAL' | 'HARD'

type RoomDetail = {
  id: number
  title: string
  host_id: number
  level: Difficulty
  entry_fee: number
}

type PlayerInfo = {
  user_id: number
  nickname: string
  room_id: string
  turtle_id: string
}

type FinishRow = {
  nickname: string;
  pointChange: number;
  rank: 'FIRST' | 'SECOND' | 'THIRD' | 'LOSE' | string;
  selectedTurtle: string | number;
  userId: number;
  winAmount: number;
}

type FinishPayload = {
  winner: number
  results: FinishRow[]
}

const difficultyMap = { EASY: 4, NORMAL: 6, HARD: 8 } as const

export default function TurtleRunPage() {
  const { id } = useParams<{ id: string }>() // 문자열
  const userId = useAuthStore((s) => s.user?.id) ?? null

  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [players, setPlayers] = useState<PlayerInfo[]>([]) // ← 기본값을 []로
  const [loading, setLoading] = useState(true)

  const [finishResults, setFinishResults] = useState<{ idx: number; rank: string }[] | null>(null)

  const orderRank = (a: string, b: string) => {
    const w = { FIRST: 1, SECOND: 2, THIRD: 3, LOSE: 99 }
    return (w[a as keyof typeof w] ?? 99) - (w[b as keyof typeof w] ?? 99)
  }

  const toIdx = (v: number | string): number => {
    if (typeof v === 'number') return v
    const n = Number(v); if (Number.isFinite(n)) return n
    const s = String(v).toLowerCase()
    const i = COLOR_ORDER.findIndex((c: any) => String(c).toLowerCase() === s)
    return i >= 0 ? i : -1
  }

  // 결과 모달(현재 주석 처리된 UI라 내부 상태만 유지)
  const finishHandledRef = useRef(false)

  // 전역 store
  const isHost = useTurtleStore((s) => s.isHost)
  const setIsHost = useTurtleStore((s) => s.setIsHost)
  const setSelected = useTurtleStore((s) => s.setSelected)
  const getSelectedIndex = useTurtleStore((s) => s.getSelectedIndex)

  const router = useRouter();
  const REDIRECT_SECS = 5;

  // 1) 방 정보: REST
  useEffect(() => {
    if (!id) return
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await api.get<RoomDetail>(`/api/gameroom/${id}`)
        if (!alive) return
        setRoom(data)
        if (userId != null) setIsHost(data.host_id === userId)
        // 디버깅용
        // console.log('[room fetched]', data)
      } catch (e) {
        console.error('[room fetch error]', e)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, userId, setIsHost])

  // 2) 소켓 하나로 통일: 플레이어 + 레이스
  const { send, connected } = useTurtleSocket(String(id), userId, {
    topics: {
      race: (rid) => `/topic/game/turtle/${rid}`, // 진행/결승
      players: (rid) => `/topic/game/turtle/${rid}`, // 플레이어 목록
    },
    onPlayers: (rawList) => {
      // 서버 → 클라 표준화
      const list: PlayerInfo[] = (rawList as any[]).map((p) => ({
        user_id: p.userId ?? p.user_id,
        nickname: p.nickname,
        room_id: String(p.roomId ?? p.room_id),
        turtle_id: p.turtleId ?? p.turtle_id,
      }))
      setPlayers(list)

      // 내 선택을 전역에 반영하고 싶다면 여기서
      const me = list.find((x) => x.user_id === userId)
      if (me) {
        // color → index 변환이 필요하면 변환 후:
        // setSelected(colorToIndex(me.turtle_id))
      }

      // console.log('[players update]', list)
    },
    onFinish: (pkt) => {
      const finishRows: FinishRow[] =
      Array.isArray(pkt?.data?.results) ? pkt.data.results :
      Array.isArray(pkt?.results)       ? pkt.results       :
      Array.isArray(pkt?.data)          ? pkt.data          :
      Array.isArray(pkt)                ? pkt               :
      []

    // Track용 표시는 유지
    const resultsForTrack = finishRows
      .map((r: any) => ({ idx: r.idx ?? toIdx(r.selectedColor ?? r.selectedTurtle), rank: r.rank }))
      .filter((x: any) => x.idx >= 0)
    setFinishResults(resultsForTrack)

    // ✅ 모달에는 raw results만 넘김
    setPodiumResults(finishRows)
    setPodiumOpen(true)
    setCountdownSec(REDIRECT_SECS)    // ⬅️ 카운트다운 시작 (기존 로직 유지)
  },
})

  // 3) 카운트다운 & 시작 SEND (연결/권한 체크 + 토큰 헤더 추가)
  const [showCountdown, setShowCountdown] = useState(true)
  const [count, setCount] = useState<number | null>(3)

  useEffect(() => {
    if (!room) return
    setShowCountdown(true)
    setCount(3)

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev === null) return prev
        if (prev > 0) return prev - 1

        setTimeout(() => setShowCountdown(false), 100)
        clearInterval(timer)

        if (isHost) {
          if (!connected) {
            console.warn('[start] socket not connected yet, skip this tick')
          } else {
            const token = tokenStore.get()
            // 서버 스펙: /app/turtle/start/{roomId}
            send(`/app/turtle/start/${id}`, undefined, token ? { Authorization: `Bearer ${token}` } : undefined)
            // console.log('[start] sent')
          }
        }
        return 0
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [room, isHost, id, connected, send])

  // 4) 결과 모달
  const [podiumOpen, setPodiumOpen] = useState(false);
  const [podiumResults, setPodiumResults] = useState<FinishRow[]>([]);
  const [countdownSec, setCountdownSec] = useState(REDIRECT_SECS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!podiumOpen) {
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      return;
    }
    if (countdownRef.current) return;

    countdownRef.current = setInterval(() => {
      setCountdownSec(prev => (prev <= 1 ? 0 : prev - 1)); // ← 숫자만 업데이트
    }, 1000);

    return () => {
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    };
  }, [podiumOpen]);

  // 중복 실행 방지
  const didNavigateRef = useRef(false);

  useEffect(() => {
    if (!podiumOpen) return;
    if (countdownSec !== 0) return;
    if (didNavigateRef.current) return;
    didNavigateRef.current = true;

    (async () => {
      try {
        // 방 상태 WAITING 전환 (실패 무시)
        await api.post(`/api/gameroom/start/${id}`, { status: 'WAITING' }).catch(() => {});
      } finally {
        // 레이스 상태 초기화 후 라우팅
        useTurtleStore.getState().resetRace();
        startTransition(() => {
          router.push(`/play/rooms/${id}`);
        });
      }
    })();
  }, [podiumOpen, countdownSec, id, router]);

  // ---- 렌더 전 보호: players는 더 이상 가드하지 않음
  if (loading || !room) return null

  const turtleCount = difficultyMap[room.level]
  const turtleImages = Array.from({ length: 8 }).map((_, i) => `/turtle${i + 1}.png`)
  const selectedIdx = getSelectedIndex(turtleCount)

  return (
    <div className="flex min-h-svh w-screen items-center justify-center bg-white">
      <div
        id="gameRoot"
        className="relative isolate h-[min(92svh,900px)] w-[min(96vw,1700px)] overflow-hidden rounded-[28px] bg-[#ffffe8] shadow-lg"
      >
        <Track
          difficulty={room.level}
          turtleImages={turtleImages.slice(0, turtleCount)}
          selected={selectedIdx}
          onSelect={(idx) => {
            // 인덱스→색 문자열로 저장 (스토어에 indexToColor가 있으면 그걸 써도 OK)
            const COLOR_ORDER = ['green','orange','pink','yellow','brown','purple','gray','blue'] as const;
            const color = idx == null || idx < 0 || idx >= COLOR_ORDER.length ? null : COLOR_ORDER[idx];
            setSelected(color);
          }}
          overlayShow={showCountdown}
          overlayCount={count}
          finishResults={finishResults ?? undefined}
          />

          <PodiumModal
          open={podiumOpen}
          onClose={() => setPodiumOpen(false)}
          results={podiumResults}
          title='거북이 시상식'
          subtitle='축하합니다! 경기가 종료되었습니다.'
          countdownSec={countdownSec}
        />
      </div>
    </div>
  )
}
