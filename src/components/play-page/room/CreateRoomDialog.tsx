'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const CreateRoomSchema = z.object({
  title: z.string().min(1, '방 이름을 입력해주세요.'),
  game: z.enum(['TURTLE', 'MUGUNGHWA']),
  level: z.enum(['HARD', 'NORMAL', 'EASY']),
})

export type CreateRoomValues = z.infer<typeof CreateRoomSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 실제 생성 API를 붙일 위치 */
  onCreate: (data: CreateRoomValues) => Promise<void> | void
}

export function CreateRoomDialog({ open, onOpenChange, onCreate }: Props) {
  const form = useForm<CreateRoomValues>({
    resolver: zodResolver(CreateRoomSchema),
    defaultValues: { title: '', game: 'TURTLE', level: 'NORMAL' },
    mode: 'onChange',
  })
  const [submitting, setSubmitting] = useState(false)

  async function submit(values: CreateRoomValues) {
    setSubmitting(true)
    try {
      await onCreate(values)
      onOpenChange(false) // 성공 시 닫기
      form.reset({ title: '', game: 'TURTLE', level: 'NORMAL' })
    } finally {
      setSubmitting(false)
    }
  }

  const game = form.watch('game')
  const level = form.watch('level')

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // 바깥 클릭/ESC 닫힘도 여기로 들어옴
        onOpenChange(v)
        if (!v) form.reset({ title: '', game: 'TURTLE', level: 'NORMAL' }) // 닫힐 때 초기화
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
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => form.setValue('game', 'TURTLE', { shouldValidate: true })}
                    className={cn(
                      'rounded-xl border p-2 transition',
                      game === 'TURTLE' ? 'border-secondary-royal ring-secondary-royal/30 ring-2' : 'border-muted',
                    )}
                    aria-pressed={game === 'TURTLE'}
                  >
                    <div className="relative h-40 w-full overflow-hidden rounded-lg">
                      <Image src="/games/turtle.png" alt="거북이 달리기" fill className="object-cover" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => form.setValue('game', 'MUGUNGHWA', { shouldValidate: true })}
                    className={cn(
                      'rounded-xl border p-2 transition',
                      game === 'MUGUNGHWA' ? 'border-secondary-royal ring-secondary-royal/30 ring-2' : 'border-muted',
                    )}
                    aria-pressed={game === 'MUGUNGHWA'}
                  >
                    <div className="relative h-40 w-full overflow-hidden rounded-lg">
                      <Image src="/games/mugunghwa.png" alt="무궁화꽃이 피었습니다" fill className="object-cover" />
                    </div>
                  </button>
                </div>
              </div>

              {/* 난이도 */}
              <div>
                <div className="mb-3 text-base font-semibold">난이도</div>
                <div className="flex items-center gap-3">
                  <LevelChip
                    label="상"
                    active={level === 'HARD'}
                    className="bg-game-hard"
                    onClick={() => form.setValue('level', 'HARD', { shouldValidate: true })}
                  />
                  <LevelChip
                    label="중"
                    active={level === 'NORMAL'}
                    className="bg-game-normal"
                    onClick={() => form.setValue('level', 'NORMAL', { shouldValidate: true })}
                  />
                  <LevelChip
                    label="하"
                    active={level === 'EASY'}
                    className="bg-game-easy"
                    onClick={() => form.setValue('level', 'EASY', { shouldValidate: true })}
                  />
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

function LevelChip({
  label,
  active,
  className,
  onClick,
}: {
  label: string
  active: boolean
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white',
        className,
        active ? 'ring-secondary-royal/50 ring-2 ring-offset-2' : 'opacity-70',
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}
