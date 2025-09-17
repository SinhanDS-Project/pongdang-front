'use client'

import { ChangePongModal } from '@/components/my-page/ChangePongModal'
import { ProfileEditDialog } from '@/components/my-page/ProfileEditModal'
import { PongPagination } from '@/components/PongPagination'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/stores/auth-store'
import { Droplet, Heart, Wallet } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'

type Balance = { normal: number; donate: number }
type Row = { id: number; title: string; amount: number; diff?: number; date: string }

type TabKey = 'pong' | 'donate' | 'purchase' | 'chatlog'

const mockBalance: Balance = { normal: 100, donate: 10 }
const mockRows: Row[] = [
  { id: 1, title: '해당 내역이 들어가는 곳입니다.', amount: 100, diff: +10, date: '2025.08.30' },
  { id: 2, title: '해당 내역이 들어가는 곳입니다.', amount: 90, diff: +20, date: '2025.08.30' },
  { id: 3, title: '해당 내역이 들어가는 곳입니다.', amount: 70, diff: -30, date: '2025.08.30' },
  { id: 4, title: '해당 내역이 들어가는 곳입니다.', amount: 100, diff: +10, date: '2025.08.30' },
  { id: 5, title: '해당 내역이 들어가는 곳입니다.', amount: 90, diff: -20, date: '2025.08.30' },
  { id: 6, title: '해당 내역이 들어가는 곳입니다.', amount: 110, diff: +50, date: '2025.08.30' },
]

export default function MyPageContent() {
  const user = useCurrentUser()

  const [openEdit, setOpenEdit] = useState(false)
  const [openChange, setOpenChange] = useState(false)

  const [active, setActive] = useState<TabKey>('pong')
  const [page, setPage] = useState(1)
  const pageSize = 6

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return mockRows.slice(start, start + pageSize)
  }, [page])

  const totalPages = Math.max(1, Math.ceil(mockRows.length / pageSize))

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0] // "2025-09-03"
  }

  return (
    <div className="container mx-auto flex grow flex-col gap-y-4 p-4 md:p-6 lg:p-8">
      {/* 상단 영역 */}
      <div className="grid grid-cols-4 gap-x-8">
        <div className="bg-placeholder relative aspect-square w-full overflow-hidden rounded-full">
          <Image
            src={user?.profile_img || '/placeholder-banner.png'}
            alt={`${user?.user_name} 프로필 이미지`}
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            className="object-cover"
          />
        </div>

        <div className="col-span-3 flex flex-col gap-y-4">
          <div className="flex w-full items-center justify-between gap-2 text-3xl font-extrabold">
            <div className="text-foreground">
              안녕하세요, <span className="text-secondary-royal">{user?.nickname}</span> 님
            </div>
            <div className="flex gap-x-4">
              {user?.linked_with_betting && (
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setOpenChange(true)}
                  className="hover:shadow-badge text-primary-white hover:text-primary-white bg-secondary-royal hover:bg-secondary-navy border font-semibold"
                >
                  포인트 전환하기
                </Button>
              )}
              <Button
                type="button"
                variant="default"
                onClick={() => setOpenEdit(true)}
                className="hover:shadow-badge text-primary-black hover:text-primary-white border bg-white font-semibold hover:bg-gray-300"
              >
                나의 정보확인하기
              </Button>
            </div>
          </div>
          <div className="bg-secondary-light flex grow flex-col gap-y-2 rounded-xl p-4">
            <div className="text-primary-white flex items-center gap-x-2">
              <Wallet />
              <span className="text-2xl font-bold">나의 보유 퐁</span>
            </div>
            <div className="bg-primary-white flex grow gap-x-4 rounded-lg p-4">
              <div className="flex grow flex-col">
                <div className="flex items-center gap-x-2">
                  <Droplet className="text-secondary-royal" />
                  <span className="text-base font-bold">일반 퐁</span>
                </div>
                <div className="mr-4 flex grow items-center justify-end gap-x-4 font-bold">
                  <span className="text-secondary-navy text-5xl">{user?.pong_balance}</span>
                  <span className="text-secondary-royal text-4xl">퐁</span>
                </div>
              </div>
              <div className="h-full outline-1 outline-dashed"></div>
              <div className="flex grow flex-col">
                <div className="flex items-center gap-x-2">
                  <Heart className="text-secondary-red" />
                  <span className="text-base font-bold">기부 퐁</span>
                </div>
                <div className="mr-8 flex grow items-center justify-end gap-x-4 font-bold">
                  <span className="text-secondary-navy text-5xl">{user?.dona_balance}</span>
                  <span className="text-secondary-red text-4xl">퐁</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex grow flex-col gap-0">
        <div className="flex gap-x-1">
          {[
            { key: 'pong', label: '퐁 내역' },
            { key: 'donate', label: '기부 내역' },
            { key: 'purchase', label: '구매 내역' },
            { key: 'chatlog', label: '문의 내역' },
          ].map((tap, idx) => {
            const activeTab = active === (tap.key as TabKey)

            return (
              <button
                key={idx}
                onClick={() => setActive(tap.key as TabKey)}
                className={cn(
                  'text-primary-white w-32 rounded-t-lg py-2.5 text-center text-xl font-semibold',
                  activeTab ? 'bg-secondary-sky' : 'bg-gray-300',
                )}
              >
                {tap.label}
              </button>
            )
          })}
        </div>
        <div className="bg-secondary-sky grow rounded-tr rounded-b p-2">
          <div className="bg-primary-white flex h-full w-full flex-col justify-between rounded-xs pb-4">
            <div className="flex grow items-center justify-center">
              <Table className="sm:text-md overflow-hidden text-center text-sm">
                <TableHeader>
                  <TableRow></TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-28 py-2 md:w-40">1</TableCell>
                    <TableCell className="max-w-40 truncate">타이틀</TableCell>
                    <TableCell className="text-muted-foreground hidden w-28 py-3 sm:table-cell md:w-40">날짜</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-28 py-2 md:w-40">2</TableCell>
                    <TableCell className="max-w-40 truncate">타이틀</TableCell>
                    <TableCell className="text-muted-foreground hidden w-28 py-3 sm:table-cell md:w-40">날짜</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-28 py-2 md:w-40">3</TableCell>
                    <TableCell className="max-w-40 truncate">타이틀</TableCell>
                    <TableCell className="text-muted-foreground hidden w-28 py-3 sm:table-cell md:w-40">날짜</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-28 py-2 md:w-40">4</TableCell>
                    <TableCell className="max-w-40 truncate">타이틀</TableCell>
                    <TableCell className="text-muted-foreground hidden w-28 py-3 sm:table-cell md:w-40">날짜</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-28 py-2 md:w-40">5</TableCell>
                    <TableCell className="max-w-40 truncate">타이틀</TableCell>
                    <TableCell className="text-muted-foreground hidden w-28 py-3 sm:table-cell md:w-40">날짜</TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow></TableRow>
                </TableFooter>
              </Table>
            </div>
            {/* 페이지네이션 */}
            <PongPagination
              page={1}
              totalPages={5}
              onChange={(newPage) => setPage(newPage)}
              disabled={true}
              siblingCount={1}
              className="justify-center"
            />
          </div>
        </div>
      </div>
      <ChangePongModal open={openChange} onOpenChange={setOpenChange} />
      <ProfileEditDialog open={openEdit} onOpenChange={setOpenEdit} />
    </div>
  )
}
