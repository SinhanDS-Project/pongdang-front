'use client'

import { CreateRoomDialog, type CreateRoomValues } from '@/components/play-page/room/CreateRoomDialog'
import { EmptyRoomCard } from '@/components/play-page/room/EmptyRoomCard'
import { GameRoomCard } from '@/components/play-page/room/GameRoomCard'
import { PongPagination } from '@/components/PongPagination'
import { Button } from '@/components/ui/button'
import { GameIcon } from '@/icons'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

type GameRoom = {
  id: number
  title: string
  entry_fee: number
  status: 'WAITING' | 'PLAYING'
  level: 'HARD' | 'NORMAL' | 'EASY'
  game_name: string
  count: number
}

const PAGE_SIZE = 6
const TOTAL_ROOMS = 17 // demo

export default function PlayRoomsHome() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [createOpen, setCreateOpen] = useState(false)

  const totalPages = Math.max(1, Math.ceil(TOTAL_ROOMS / PAGE_SIZE))

  const roomsThisPage: GameRoom[] = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    const end = Math.min(start + PAGE_SIZE, TOTAL_ROOMS)
    return Array.from({ length: end - start }, (_, i) => {
      const idx = start + i + 1
      return {
        id: idx,
        title: `거북이 게임하기 #${idx}`,
        entry_fee: 10 + (idx % 3) * 5,
        status: idx % 4 === 0 ? 'PLAYING' : 'WAITING',
        level: (['EASY', 'NORMAL', 'HARD'] as const)[idx % 3],
        game_name: 'Turtle Run',
        count: idx % 8,
      }
    })
  }, [page])

  const roomsWithPlaceholders = useMemo(() => {
    const placeholders = Array.from({ length: Math.max(0, PAGE_SIZE - roomsThisPage.length) }, () => null)
    return [...roomsThisPage, ...placeholders]
  }, [roomsThisPage])

  const goPage = (next: number) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set('page', String(next))
    router.push(`${pathname}?${p.toString()}`)
  }

  // 실제 생성 API 연결 위치
  async function handleCreate(data: CreateRoomValues) {
    // 예시: entry_fee, status, count 등 서버에서 결정
    // await api.post('/api/rooms', {
    //   title: data.title,
    //   game_name: data.game === 'TURTLE' ? 'Turtle Run' : 'Mugunghwa',
    //   level: data.level,
    // })
    console.log('create room:', data)
    // 생성 후 목록 새로고침/데이터 refetch
    router.refresh?.()
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between text-3xl font-extrabold">
        <div className="flex items-center gap-2">
          <div className="text-foreground/70">
            다같이 퐁!<span className="text-secondary-royal">게임밤</span>
          </div>
          <GameIcon />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-secondary-royal hover:bg-secondary-sky">
          방만들기
        </Button>
      </div>

      <div className="grid grid-cols-2 grid-rows-3 gap-2">
        {roomsWithPlaceholders.map((room, idx) =>
          room ? <GameRoomCard key={room.id} {...room} /> : <EmptyRoomCard key={`empty-${idx}`} />,
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <PongPagination page={page} totalPages={totalPages} onChange={goPage} />
      </div>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
    </div>
  )
}
