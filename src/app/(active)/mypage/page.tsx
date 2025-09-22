'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Droplet, Heart, Wallet } from 'lucide-react'

import { PongPagination } from '@/components/PongPagination'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { api } from '@/lib/net/client-axios'

import ProfileEditModal from '@/components/my-page/ProfileEditModal'
import ChangePongModal from '@/components/my-page/ChangePongModal'
import ChatLogDetailModal from '@/components/my-page/ChatLogDetail'
import { useMe } from '@/hooks/use-me'

/* ── 타입 ───────────────────────── */
type TabKey = 'pong' | 'donate' | 'purchase' | 'chatlog'

type PongHistory = {
  id: number
  user_id: number
  pong_history_type: string
  amount: number
  created_at: string | null
}

type DonationHistory = {
  id: number
  amount: number
  user_id: number
  title: string
  created_at: string
}

type PurchaseHistory = {
  id: string
  user_id: number
  name: string
  price: number
  created_at: string
}

type ChatLog = {
  id: number
  title: string
  question: string
  response: string | null
  chat_date: string
  response_date: string | null
  nickname: string
}

export default function MyPageContent() {
  const { user, status } = useMe()
  const userId: number | null = user ? user?.id : null

  const [openEdit, setOpenEdit] = useState(false)
  const [openChange, setOpenChange] = useState(false)

  const [active, setActive] = useState<TabKey>('pong')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [pongRows, setPongRows] = useState<PongHistory[]>([])
  const [donationRows, setDonationRows] = useState<DonationHistory[]>([])
  const [purchaseRows, setPurchaseRows] = useState<PurchaseHistory[]>([])
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([])
  const [selectedChatLog, setSelectedChatLog] = useState<ChatLog | null>(null)

  const size = 10
  const HISTORY_LABELS: Record<string, string> = {
    GAME_P: '게임(일반)',
    GAME_D: '게임(기부)',
    PURCHASE: '구매',
    DONATION_P: '기부(일반)',
    DONATION_D: '기부(기부)',
    ADD: '이벤트',
    ENTRY: '게임 참가',
  }

  //  API 호출
  useEffect(() => {
    let url = ''
    if (active === 'pong') url = '/api/history/wallet'
    if (active === 'donate') url = '/api/history/donation'
    if (active === 'purchase') url = '/api/history/purchase'
    if (active === 'chatlog') url = '/api/chatlog'

    api
      .get(url, { params: { page, size } })
      .then((res) => {
        if (active === 'pong') {
          setPongRows(res.data.histories.content)
          setTotalPages(res.data.histories.total_pages)
        }
        if (active === 'donate') {
          setDonationRows(res.data.content)
          setTotalPages(res.data.total_pages)
        }
        if (active === 'purchase') {
          setPurchaseRows(res.data.content)
          setTotalPages(res.data.total_pages)
        }
        if (active === 'chatlog') {
          setChatLogs(res.data.logs.content)
          setTotalPages(res.data.logs.total_pages ?? 1)
        }
      })
      .catch((err) => {
        console.error(`${active} 내역 불러오기 실패`, err)
      })
  }, [active, page])

  return (
    <div className="container mx-auto flex grow flex-col gap-y-4 p-4 md:p-6 lg:p-8">
      {/* 상단 영역 */}
      <div className="grid grid-cols-4 gap-x-8">
        <div className="bg-placeholder relative aspect-square w-full overflow-hidden rounded-full">
          <Image
            src={user?.profile_img || '/placeholder-banner.png'}
            alt={`${user?.user_name} 프로필 이미지`}
            fill
            className="object-cover"
          />
        </div>

        <div className="col-span-3 flex flex-col gap-y-4">
          <div className="flex w-full items-center justify-between gap-2 text-3xl font-extrabold">
            <div className="text-foreground">
              안녕하세요, <span className="text-secondary-royal">{user?.nickname}</span> 님
            </div>
            <div className="flex gap-x-4">
              {user?.linked_with_betting === true && (
                <Button onClick={() => setOpenChange(true)} className="bg-secondary-royal font-semibold text-white">
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

          {/* 보유 퐁 */}
          <div className="bg-secondary-light flex grow flex-col gap-y-2 rounded-xl p-4">
            <div className="text-primary-white flex items-center gap-x-2">
              <Wallet />
              <span className="text-2xl font-bold">나의 보유 퐁</span>
            </div>
            <div className="bg-primary-white flex grow gap-x-4 rounded-lg p-4">
              {/* 일반 퐁 */}
              <div className="flex grow flex-col">
                <div className="flex items-center gap-x-2">
                  <Droplet className="text-secondary-royal" />
                  <span className="text-base font-bold">일반 퐁</span>
                </div>
                <div className="mr-4 flex grow items-center justify-end gap-x-4 font-bold">
                  <span className="text-secondary-navy text-5xl">{user?.pong_balance?.toLocaleString() ?? 0}</span>
                  <span className="text-secondary-royal text-4xl">퐁</span>
                </div>
              </div>

              <div className="h-full outline-1 outline-dashed"></div>

              {/* 기부 퐁 */}
              <div className="flex grow flex-col">
                <div className="flex items-center gap-x-2">
                  <Heart className="text-secondary-red" />
                  <span className="text-base font-bold">기부 퐁</span>
                </div>
                <div className="mr-8 flex grow items-center justify-end gap-x-4 font-bold">
                  <span className="text-secondary-navy text-5xl">{user?.dona_balance?.toLocaleString() ?? 0}</span>
                  <span className="text-secondary-red text-4xl">퐁</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex grow flex-col gap-0">
        <div className="flex gap-x-1">
          {[
            { key: 'pong', label: '퐁 내역' },
            { key: 'donate', label: '기부 내역' },
            { key: 'purchase', label: '구매 내역' },
            { key: 'chatlog', label: '문의 내역' },
          ].map((tap) => (
            <button
              key={tap.key}
              onClick={() => {
                setActive(tap.key as TabKey)
                setPage(1)
              }}
              className={cn(
                'text-primary-white w-32 rounded-t-lg py-2.5 text-center text-xl font-semibold',
                active === tap.key ? 'bg-secondary-sky' : 'bg-gray-300',
              )}
            >
              {tap.label}
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className="bg-secondary-sky grow rounded-tr rounded-b p-2">
          <div className="bg-primary-white flex h-full w-full flex-col justify-between rounded-xs pb-4">
            <div className="flex grow items-center justify-center">
              <Table className="sm:text-md w-full table-auto overflow-x-auto border-b-2 border-gray-400 text-center text-sm">
                <TableHeader className="bg-white-100 sticky top-0 z-10">
                  <TableRow>
                    <TableCell className="w-16">No</TableCell>

                    {active === 'pong' && (
                      <>
                        <TableCell className="min-w-[180px]">퐁 내역 타입</TableCell>
                        <TableCell className="min-w-[120px]">퐁</TableCell>
                        <TableCell className="min-w-[180px]">날짜</TableCell>
                      </>
                    )}

                    {active === 'donate' && (
                      <>
                        <TableCell className="min-w-[240px]">제목</TableCell>
                        <TableCell className="min-w-[120px]">퐁</TableCell>
                        <TableCell className="min-w-[180px]">날짜</TableCell>
                      </>
                    )}

                    {active === 'purchase' && (
                      <>
                        <TableCell className="min-w-[240px]">상품명</TableCell>
                        <TableCell className="min-w-[120px]">퐁</TableCell>
                        <TableCell className="min-w-[180px]">날짜</TableCell>
                      </>
                    )}

                    {active === 'chatlog' && (
                      <>
                        <TableCell className="min-w-[240px]">제목</TableCell>
                        <TableCell className="min-w-[180px]">날짜</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* ── 퐁 내역 ─────────────────────── */}
                  {active === 'pong' &&
                    pongRows.map((row, idx) => {
                      const isPlus = ['GAME_P', 'GAME_D', 'ADD'].includes(row.pong_history_type)
                      return (
                        <TableRow key={row.id}>
                          <TableCell>{(page - 1) * size + (idx + 1)}</TableCell>
                          <TableCell>{HISTORY_LABELS[row.pong_history_type] ?? row.pong_history_type}</TableCell>
                          <TableCell className={isPlus ? 'font-bold text-blue-600' : 'font-bold text-red-600'}>
                            {isPlus ? '+' : '-'} {row.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      )
                    })}

                  {/* ── 기부 내역 ─────────────────────── */}
                  {active === 'donate' &&
                    donationRows.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * size + (idx + 1)}</TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.amount.toLocaleString()}</TableCell>
                        <TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))}

                  {/* ── 구매 내역 ─────────────────────── */}
                  {active === 'purchase' &&
                    purchaseRows.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * size + (idx + 1)}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.price.toLocaleString()}</TableCell>
                        <TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))}

                  {/* ── 문의 내역 ─────────────────────── */}
                  {active === 'chatlog' &&
                    chatLogs.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * size + (idx + 1)}</TableCell>
                        <TableCell>
                          <button onClick={() => setSelectedChatLog(row)} className="text-black-600 hover:underline">
                            {row.title}
                          </button>
                        </TableCell>
                        <TableCell>{new Date(row.chat_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>

                <TableFooter />
              </Table>
            </div>

            {/* 페이지네이션 */}
            <PongPagination
              page={page}
              totalPages={totalPages}
              onChange={(newPage) => setPage(newPage)}
              siblingCount={1}
              className="justify-center"
            />
          </div>
        </div>
      </div>

      <ChangePongModal open={openChange} onOpenChange={setOpenChange} />
      <ProfileEditModal open={openEdit} onOpenChange={setOpenEdit} />
      <ChatLogDetailModal open={!!selectedChatLog} onClose={() => setSelectedChatLog(null)} chatLog={selectedChatLog} />
    </div>
  )
}
