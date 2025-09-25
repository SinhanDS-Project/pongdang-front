'use client'

import { Droplet, Heart, Wallet } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import ChangePongModal from '@/components/my-page/ChangePongModal'
import ChatLogDetailModal from '@/components/my-page/ChatLogDetail'
import ProfileEditModal from '@/components/my-page/ProfileEditModal'
import { PongPagination } from '@/components/PongPagination'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { api } from '@/lib/net/client-axios'
import { cn } from '@/lib/utils'

import { useMe } from '@/hooks/use-me'
import { useIsMobile } from '@/hooks/use-mobile'

/* ── 타입 ───────────────────────── */
type TabKey = 'pong' | 'donate' | 'purchase' | 'chatlog'

type PongHistoryType = {
  id: number
  user_id: number
  pong_history_type: string
  amount: number
  created_at: string | Date
}

type DonationHistoryType = {
  id: number
  amount: number
  user_id: number
  title: string
  created_at: string
}

type PurchaseHistoryType = {
  id: string
  user_id: number
  name: string
  price: number
  created_at: string
}

type ChatLogType = {
  id: number
  title: string
  question: string
  response: string | null
  chat_date: string
  response_date: string | null
  nickname: string
}

const HISTORY_LABELS: Record<string, string> = {
  GAME_P: '게임(일반)',
  GAME_D: '게임(기부)',
  PURCHASE: '구매',
  DONATION_P: '기부(일반)',
  DONATION_D: '기부(기부)',
  ADD: '이벤트',
  ENTRY: '게임 참가',
}

export default function MyPageContent() {
  const { user } = useMe()

  const [openEdit, setOpenEdit] = useState<boolean>(false)
  const [openChange, setOpenChange] = useState<boolean>(false)

  // 상태
  const [isError, setIsError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [active, setActive] = useState<TabKey>('pong')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [pongRows, setPongRows] = useState<PongHistoryType[]>([])
  const [donationRows, setDonationRows] = useState<DonationHistoryType[]>([])
  const [purchaseRows, setPurchaseRows] = useState<PurchaseHistoryType[]>([])
  const [chatLogs, setChatLogs] = useState<ChatLogType[]>([])
  const [selectedChatLog, setSelectedChatLog] = useState<ChatLogType | null>(null)

  const size = 10

  // API 호출
  useEffect(() => {
    let url = ''
    if (active === 'pong') url = '/api/history/wallet'
    if (active === 'donate') url = '/api/history/donation'
    if (active === 'purchase') url = '/api/history/purchase'
    if (active === 'chatlog') url = '/api/chatlog'

    setIsLoading(true)
    setIsError(false)

    api
      .get(url, { params: { page, size } })
      .then((res) => {
        if (active === 'pong') {
          setPongRows(res.data.histories.content ?? [])
          setTotalPages(res.data.histories.total_pages ?? 1)
        }
        if (active === 'donate') {
          setDonationRows(res.data.content ?? [])
          setTotalPages(res.data.total_pages ?? 1)
        }
        if (active === 'purchase') {
          setPurchaseRows(res.data.content ?? [])
          setTotalPages(res.data.total_pages ?? 1)
        }
        if (active === 'chatlog') {
          setChatLogs(res.data.logs.content ?? [])
          setTotalPages(res.data.logs.total_pages ?? 1)
        }
        setIsError(false)
      })
      .catch((err) => {
        console.error(`${active} 내역 불러오기 실패`, err)
        setIsError(true)
        // 실패 시 기존 rows를 초기화해주는 것도 안정적
        setPongRows([])
        setDonationRows([])
        setPurchaseRows([])
        setChatLogs([])
      })
      .finally(() => setIsLoading(false))
  }, [active, page])

  const isMobile = useIsMobile()

  return (
    <div className="container mx-auto flex grow flex-col gap-y-4 p-4 md:p-6 lg:p-8">
      {/* 상단 영역 */}
      <div className={cn("gap-4", isMobile ? "flex flex-col" : "grid grid-cols-4 gap-x-8")}>
        <div className={cn("bg-placeholder relative aspect-square overflow-hidden rounded-full", isMobile ? "w-24 mx-auto" : "w-full mx-0")}>
          <Image
            src={user?.profile_img || '/placeholder-banner.png'}
            alt={`${user?.user_name} 프로필 이미지`}
            fill
            className="object-cover"
          />
        </div>

        <div className={cn("flex flex-col gap-y-4", !isMobile && "col-span-3")}>
          <div className={cn("font-extrabold", isMobile ? "flex flex-col items-center gap-3 text-center text-xl" : "flex flex-row items-center justify-between text-left text-3xl")}>
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
              <span className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>나의 보유 퐁</span>
            </div>
            <div className="bg-primary-white flex grow gap-x-4 rounded-lg p-4">
              {/* 일반 퐁 */}
              <div className="flex grow flex-col">
                <div className="flex items-center gap-x-2">
                  <Droplet className="text-secondary-royal" />
                  <span className={cn("font-bold", isMobile ? "text-sm" : "text-base")}>일반 퐁</span>
                </div>
                <div className="mr-4 flex grow items-center justify-end gap-x-4 font-bold">
                  <span className={cn("text-secondary-navy", isMobile ? "text-2xl" : "text-5xl")}>{user?.pong_balance?.toLocaleString() ?? 0}</span>
                  <span className={cn("text-secondary-royal", isMobile ? "text-xl" : "text-4xl")}>퐁</span>
                </div>
              </div>

              <div className="h-full outline-1 outline-dashed"></div>

              {/* 기부 퐁 */}
              <div className="flex grow flex-col">
                <div className="flex items-center gap-x-2">
                  <Heart className="text-secondary-red" />
                  <span className={cn("font-bold", isMobile ? "text-sm" : "text-base")}>기부 퐁</span>
                </div>
                <div className="mr-8 flex grow items-center justify-end gap-x-4 font-bold">
                  <span className={cn("text-secondary-navy", isMobile ? "text-2xl" : "text-5xl")}>{user?.dona_balance?.toLocaleString() ?? 0}</span>
                  <span className={cn("text-secondary-red", isMobile ? "text-xl" : "text-4xl")}>퐁</span>
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
                'text-primary-white w-24 sm:w-28 md:w-32 rounded-t-lg py-2.5 text-center text-md sm:text-base md:text-lg lg:text-xl font-semibold',
                active === tap.key ? 'bg-secondary-sky' : 'bg-gray-300',
              )}
            >
              {tap.label}
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className="bg-secondary-sky grow rounded-tr rounded-b p-2">
          <div className="bg-primary-white flex h-full w-full flex-col justify-between rounded-xs px-2 pt-1 pb-4">
            {isError ? (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                정보를 불러오지 못했습니다.
              </div>
            ) : isLoading ? (
              <div className="text-muted-foreground flex h-full items-center justify-center">불러오는 중…</div>
            ) : (
              <Table className="text-center text-sm sm:text-base">
                {active !== 'chatlog' ? (
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="hidden text-center sm:table-cell sm:w-20">NO</TableHead>
                      <TableHead className="text-center">내용</TableHead>
                      <TableHead className="text-center">내역</TableHead>
                      <TableHead className="hidden text-center sm:table-cell sm:w-60">날짜</TableHead>
                    </TableRow>
                  </TableHeader>
                ) : (
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="hidden text-center sm:table-cell sm:w-20">NO</TableHead>
                      <TableHead className="text-center">내용</TableHead>
                      <TableHead className="hidden text-center sm:table-cell sm:w-60">날짜</TableHead>
                    </TableRow>
                  </TableHeader>
                )}
                {/* 헤더 + 바디 컴포넌트 */}
                {active === 'pong' && <PongHistory history={pongRows} page={page} size={size} />}
                {active === 'donate' && <DonationHistory history={donationRows} page={page} size={size} />}
                {active === 'purchase' && <PurchaseHistory history={purchaseRows} page={page} size={size} />}
                {active === 'chatlog' && (
                  <ChatLog history={chatLogs} onOpen={setSelectedChatLog} page={page} size={size} />
                )}
              </Table>
            )}

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

function formatDate(date: string | Date) {
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  return parsedDate.toISOString().split('T')[0] // "2025-09-03"
}

function PongHistory({ history, page, size }: { history: PongHistoryType[]; page: number; size: number }) {
  return (
    <TableBody>
      {history.map((row, idx) => {
        const isPlus = ['GAME_P', 'GAME_D', 'ADD'].includes(row.pong_history_type)

        return (
          <TableRow key={row.id}>
            <TableCell className="hidden sm:table-cell">{(page - 1) * size + (idx + 1)}</TableCell>
            <TableCell className="py-4">{HISTORY_LABELS[row.pong_history_type] ?? row.pong_history_type}</TableCell>
            <TableCell className={cn('font-bold', isPlus ? 'text-blue-400' : 'text-red-400')}>
              {isPlus ? '+' : '-'} {row.amount}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{formatDate(row.created_at)}</TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  )
}

function DonationHistory({ history, page, size }: { history: DonationHistoryType[]; page: number; size: number }) {
  return (
    <TableBody>
      {history.map((row, idx) => {
        return (
          <TableRow key={row.id}>
            <TableCell className="hidden sm:table-cell">{(page - 1) * size + (idx + 1)}</TableCell>
            <TableCell className="truncate max-w-[200px]">{row.title}</TableCell>
            <TableCell className="flex items-center justify-center gap-x-1 py-4 text-red-400">
              <Heart />
              <span className="font-bold">{row.amount}</span>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{formatDate(row.created_at)}</TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  )
}

function PurchaseHistory({ history, page, size }: { history: PurchaseHistoryType[]; page: number; size: number }) {
  return (
    <TableBody>
      {history.map((row, idx) => {
        return (
          <TableRow key={row.id}>
            <TableCell className="hidden sm:table-cell">{(page - 1) * size + (idx + 1)}</TableCell>
            <TableCell className="py-4 truncate max-w-[200px]">{row.name}</TableCell>
            <TableCell className="font-bold">{row.price}</TableCell>
            <TableCell className="hidden sm:table-cell">{formatDate(row.created_at)}</TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  )
}

function ChatLog({
  history,
  onOpen,
  page,
  size,
}: {
  history: ChatLogType[]
  onOpen: (data: ChatLogType) => void
  page: number
  size: number
}) {
  return (
    <TableBody>
      {history.map((row, idx) => {
        return (
          <TableRow key={row.id}>
            <TableCell className="hidden sm:table-cell">{(page - 1) * size + (idx + 1)}</TableCell>
            <TableCell onClick={() => onOpen(row)} className="cursor-pointer py-4 hover:font-bold hover:underline truncate max-w-[200px]">
              {row.title}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{formatDate(row.chat_date)}</TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  )
}
