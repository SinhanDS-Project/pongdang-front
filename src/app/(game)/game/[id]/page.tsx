import { serverFetchJSON } from '@lib/net/server-fetch'
import { notFound, redirect } from 'next/navigation'

type RoomDetail = {
  id: number
  game_type: 'turtle' | 'board'
}

export const dynamic = 'force-dynamic' // ✅ 캐시 방지 (실시간 데이터용)

export default async function GameEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let data: RoomDetail | null = null
  try {
    data = await serverFetchJSON<RoomDetail>(`/api/gameroom/${id}`, {
      auth: 'auto', // HttpOnly refresh 쿠키 자동 전달
      cache: 'no-store', // SSR 시 캐시 방지
    })
  } catch (e) {
    console.error('방 정보를 불러오지 못했습니다:', e)
    notFound()
  }

  if (!data) notFound()

  // 🔸 게임 타입에 따라 해당 게임 페이지로 라우팅
  if (data.game_type === 'turtle') {
    redirect(`/turtle-run/${id}`)
  }
  if (data.game_type === 'board') {
    redirect(`/pong-marble/${id}`)
  }

  // 지원하지 않는 타입일 경우 404
  notFound()
}
