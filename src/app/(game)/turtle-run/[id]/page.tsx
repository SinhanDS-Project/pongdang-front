'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Track } from '@components/turtle-run-page'

import { tokenStore } from '@stores/token-store'
import { api } from '@lib/net/client-axios'
import { useTurtleSocket } from '@lib/socket' // ← onPlayers, onFinish 둘 다 여기서 처리

import { useMe } from '@/hooks/use-me'
import { useTurtleStore } from '@stores/turtle-store'

import { PodiumModal } from '@/components/turtle-run-page/PodiumModal'
import { useMe } from '@/hooks/use-me'

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

const difficultyMap = { EASY: 4, NORMAL: 6, HARD: 8 } as const

export default function TurtleRunPage() {
  const { id } = useParams<{ id: string }>() // 문자열
  const { user } = useMe()
  const userId = user && user.id

  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [players, setPlayers] = useState<PlayerInfo[]>([]) // ← 기본값을 []로
  const [loading, setLoading] = useState(true)

  const [finishResults, setFinishResults] = useState<{ idx: number; rank: string }[] | null>(null)
  // 이동 목표 시각(ms)
  const [redirectAt, setRedirectAt] = useState<number | null>(null);

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
      }
    },
    onFinish: (pkt) => {
      const finishRows: FinishRow[] =
      Array.isArray(pkt?.data?.results) ? pkt.data.results :
      Array.isArray(pkt?.results)       ? pkt.results       :
      Array.isArray(pkt?.data)          ? pkt.data          :
      Array.isArray(pkt)                ? pkt               :
      []

    // 1) 마지막 보이는 진행률 가져오기 (displayed 우선, 없으면 positions)
    const { positions, displayed, applyFinishOverride } = useTurtleStore.getState();
    const latest = (displayed?.length ? displayed : positions) ?? [];
    const N = latest.length;

    const winners = latest
    .map((v, i) => (v > 100 ? i : -1))
    .filter(i => i >= 0)

    // 2) Track 하이라이트용: 진행률로 승/패만 구분
     const resultsForTrack = Array.from({ length: N }, (_, i) => ({
      idx: i,
      rank: winners.includes(i) ? 'VICTORY' : 'DEFEAT',
    }))
    setFinishResults(resultsForTrack)

    // 4) 오버라이드 좌표 계산
    const targets = Array.from({ length: N }, (_, i) => {
      if (winners.includes(i)) {
        return 101 // ✅ 승리 거북이는 finish line +1
      }
      return latest[i] ?? 0 // ❌ 패배 거북이는 그대로 멈춤
    })

    applyFinishOverride(targets)


    // ✅ 이동 목표 시각 고정 (지금으로부터 5초 후)
    const deadline = Date.now() + REDIRECT_SECS * 1000;
    setRedirectAt(deadline);

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
            send(`/app/turtle/start/${id}`, undefined, token ? { Authorization: `Bearer ${token}` } : undefined)
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

  const handlePodiumClose = () => {
    setPodiumOpen(false)
  }

  // 중복 실행 방지
  const didNavigateRef = useRef(false);

  // ✅ redirectAt이 정해지면, 모달이 닫혀도 계속 감소
  useEffect(() => {
    if (!redirectAt) return;

    const tick = () => {
      const remainMs = redirectAt - Date.now();
      const remainSec = Math.max(0, Math.ceil(remainMs / 1000));
      setCountdownSec(remainSec);

      // ✅ 0초 도달 시 한 번만 네비게이션
      if (remainSec === 0 && !didNavigateRef.current) {
        didNavigateRef.current = true;
        (async () => {
          try {
            await api.post(`/api/gameroom/start/${id}`, { status: 'WAITING' }).catch(() => {});
          } finally {
            useTurtleStore.getState().resetRace();
            router.push(`/play/rooms/${id}`); // 필요 시 경로 변경
          }
        })();
      }
    };

  // 250~500ms 정도로 부드럽게(굳이 1초 간격일 필요 없음)
  const iv = setInterval(tick, 300);
  tick(); // 즉시 1회

  return () => clearInterval(iv);
}, [redirectAt, id, router]);

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
          onClose={handlePodiumClose}
          results={podiumResults}
          title='거북이 시상식'
          subtitle='축하합니다! 경기가 종료되었습니다.'
          countdownSec={countdownSec}
        />
      </div>
    </div>
  )
}
