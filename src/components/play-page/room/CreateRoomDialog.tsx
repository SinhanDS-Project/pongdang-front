'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { api } from '@/lib/net/client-axios'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

/* -------------------- 타입/스키마 -------------------- */
const CreateRoomSchema = z.object({
  title: z.string(),
  game_level_id: z.number(),
})

export type CreateRoomValues = z.infer<typeof CreateRoomSchema>

/** 백엔드 응답 타입 */
type GameItem = {
  id: number
  name: string
  game_img: string
}

type GameListRes = {
  games: GameItem[]
}

type LevelItem = {
  id: number
  level: 'HARD' | 'NORMAL' | 'EASY' | string
  entry_fee: number
  game_id: number
}

type LevelListRes = {
  levels: LevelItem[]
}

/** 이미지 URL 조합기 (환경변수에 맞춰 조정) */
function getGameImageUrl(filename: string) {
  const base = process.env.NEXT_PUBLIC_FILE_BASE_URL || ''
  return `${base.replace(/\/$/, '')}/files/${filename}`
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomDialog({ open, onOpenChange }: Props) {
  const router = useRouter()

  const form = useForm<CreateRoomValues>({
    resolver: zodResolver(CreateRoomSchema),
    defaultValues: { title: '', game_level_id: 0 },
    mode: 'onChange',
  })

  const [submitting, setSubmitting] = useState(false)

  // 게임/난이도 로딩 상태
  const [gamesLoading, setGamesLoading] = useState(false)
  const [levelsLoading, setLevelsLoading] = useState(false)

  // 게임/난이도 데이터
  const [games, setGames] = useState<GameItem[]>([])
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [levels, setLevels] = useState<LevelItem[]>([])

  const selectedLevelId = form.watch('game_level_id')
  const selectedLevel = useMemo(() => levels.find((lv) => lv.id === selectedLevelId) || null, [levels, selectedLevelId])

  /* -------------------- 모달 열릴 때 게임 목록 불러오기 -------------------- */
  useEffect(() => {
    if (!open) return
    let alive = true
    ;(async () => {
      try {
        setGamesLoading(true)
        const { data } = await api.get<GameListRes>('/api/game/type?type=MULTI')
        if (!alive) return
        setGames(data?.games ?? [])
      } catch (e) {
        console.error('게임 목록 로드 실패', e)
        setGames([])
      } finally {
        setGamesLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [open])

  /* -------------------- 게임 클릭 → 난이도 목록 로드 -------------------- */
  async function loadLevels(gameId: number) {
    try {
      setLevelsLoading(true)
      setSelectedGameId(gameId)
      // 선택 초기화
      form.setValue('game_level_id', 0, { shouldValidate: true })
      form.clearErrors('game_level_id')

      const { data } = await api.get<LevelListRes>(`/api/game/level/${gameId}`)
      const lv = data?.levels ?? []
      setLevels(lv)

      // 난이도 1개면 자동 선택 + 메시지(FormMessage)만 노출
      if (lv.length === 1) {
        form.setValue('game_level_id', lv[0].id, { shouldValidate: true })
        form.setError('game_level_id', {
          type: 'manual',
          message: `이 게임은 난이도 선택이 없습니다.${
            typeof lv[0].entry_fee !== 'undefined' ? ` (참가비 ${lv[0].entry_fee}퐁)` : ''
          }`,
        })
      }
    } catch (e) {
      console.error('난이도 로드 실패', e)
      setLevels([])
    } finally {
      setLevelsLoading(false)
    }
  }

  /* -------------------- 제출: 방 생성 -------------------- */
  async function submit(values: CreateRoomValues) {
    if (!values.game_level_id) {
      form.setError('game_level_id', { message: '난이도를 선택해주세요.' })
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/api/gameroom', {
        title: values.title,
        game_level_id: values.game_level_id,
      })

      onOpenChange(false)
      form.reset({ title: '', game_level_id: 0 })
      router.push(`/play/rooms/${data?.id}`) // ✅ redirect → push
    } catch (e) {
      console.error('방 생성 실패', e)
      // 필요 시 toast 처리
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          form.reset({ title: '', game_level_id: 0 })
          setSelectedGameId(null)
          setLevels([])
          form.clearErrors()
        }
      }}
    >
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold">방만들기</DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-2 pb-6">
          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
              {/* 방 이름 */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div>
                        <label className="mb-2 block text-base font-semibold">방 이름</label>
                        <Input placeholder="방 이름" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 게임 선택 */}
              <div>
                <div className="mb-2 text-base font-semibold">게임 선택</div>

                {/* ✅ 높이 고정으로 모달 점프 방지 */}
                <div className="min-h-[220px]">
                  {gamesLoading ? (
                    <div className="text-muted-foreground text-sm">게임을 불러오는 중…</div>
                  ) : games.length === 0 ? (
                    <div className="text-muted-foreground text-sm">표시할 게임이 없습니다.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {games.map((g) => {
                        const active = selectedGameId === g.id
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => loadLevels(g.id)}
                            className={cn(
                              'relative aspect-square overflow-hidden rounded-xl border transition',
                              active ? 'border-secondary-royal ring-secondary-royal/30 ring-2' : 'border-muted',
                            )}
                            aria-pressed={active}
                          >
                            <Image
                              src={getGameImageUrl(g.game_img)}
                              alt={g.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 난이도 선택 (게임 선택 후) */}
              <div className="mt-4">
                {/* ✅ 높이 고정으로 모달 점프 방지 */}
                <div className="min-h-[150px]">
                  {selectedGameId ? (
                    <>
                      <div className="mb-3 text-base font-semibold">난이도</div>

                      {levelsLoading ? (
                        <div className="text-muted-foreground text-sm">난이도를 불러오는 중…</div>
                      ) : levels.length === 0 ? (
                        <div className="text-muted-foreground text-sm">선택 가능한 난이도가 없습니다.</div>
                      ) : levels.length === 1 ? (
                        // ✅ 선택 UI 숨기고 FormMessage만 노출
                        <FormMessage>{form.formState.errors.game_level_id?.message}</FormMessage>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            {levels.map((lv) => {
                              const active = selectedLevelId === lv.id
                              return (
                                <button
                                  key={lv.id}
                                  type="button"
                                  onClick={() => {
                                    form.clearErrors('game_level_id')
                                    form.setValue('game_level_id', lv.id, { shouldValidate: true })
                                  }}
                                  className={cn(
                                    'rounded-xl border p-3 text-left transition',
                                    active ? 'border-secondary-royal ring-secondary-royal/30 ring-2' : 'border-muted',
                                  )}
                                  aria-pressed={active}
                                >
                                  <div className="text-sm font-bold">{labelize(lv.level)}</div>
                                  {'entry_fee' in lv && typeof lv.entry_fee !== 'undefined' && (
                                    <div className="text-muted-foreground mt-1 text-xs">참가비 {lv.entry_fee}퐁</div>
                                  )}
                                </button>
                              )
                            })}
                          </div>

                          {/* 선택된 난이도 요약 */}
                          {selectedLevel && (
                            <div className="bg-muted text-muted-foreground mt-2 rounded-md p-3 text-xs">
                              선택: {labelize(selectedLevel.level)}
                              {typeof selectedLevel.entry_fee !== 'undefined' &&
                                ` / 참가비 ${selectedLevel.entry_fee}퐁`}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    // 게임 미선택 상태에서도 높이 고정 유지
                    <div className="text-muted-foreground text-sm">게임을 먼저 선택해주세요.</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={submitting} className="bg-secondary-royal hover:bg-secondary-sky">
                  {submitting ? '생성중…' : '방만들기'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function labelize(level: string) {
  switch (level) {
    case 'HARD':
      return '상'
    case 'NORMAL':
      return '중'
    case 'EASY':
      return '하'
    default:
      return level
  }
}
