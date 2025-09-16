// 'use client'

// import BettingLinkModal from '@/components/modals/BettingLinkModal'
// import ChatlogDetailModal from '@/components/modals/ChatlogDetailModal'
// import PongConvertModal from '@/components/modals/PongConvertModal'
// import ProfileEditModal from '@/components/modals/ProfileEditModal'
// import { logout, updateUser, useMe, useMyChatlogs, useMyDonations, useMyPurchases, usePointToPong } from '@/lib/swr'
// import { ChatlogItem } from '@/types/chatlog'
// import type { DonationItem } from '@/types/donation'
// import type { PurchaseItem } from '@/types/purchase'
// import { UpdateUserPayload, UserMe } from '@/types/user'
// import { useRouter } from 'next/navigation'
// import { useState } from 'react'
// import { mutate } from 'swr'

// export default function ProfilePage() {
//   const { data, error, isLoading } = useMe() // ⬅️ API 호출
//   const [infoOpen, setInfoOpen] = useState(false)
//   const [convertOpen, setConvertOpen] = useState(false)
//   const [linkOpen, setLinkOpen] = useState(false)

//   const linked = !!data?.linked_with_betting
//   const { point_balance, convert, isLoading: ptLoading } = usePointToPong(linked)
//   const router = useRouter()

//   if (isLoading) {
//     return (
//       <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
//         <div className="animate-pulse space-y-6">
//           <div className="h-8 w-56 rounded bg-gray-200" />
//           <div className="h-28 w-full rounded-2xl bg-gray-200" />
//         </div>
//       </div>
//     )
//   }

//   if (error || !data) {
//     const msg = (error as any)?.response?.data?.message || '내 정보 조회에 실패했습니다.'
//     return (
//       <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
//         <p className="text-red-600">{msg}</p>;
//       </div>
//     )
//   }

//   const me: UserMe = data

//   return (
//     <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
//       {/* 상단 프로필 */}
//       <div className="flex items-start justify-between gap-6">
//         <div className="flex items-center gap-5">
//           <div className="pt-2">
//             <p className="text-2xl font-semibold">
//               안녕하세요, <span className="text-primary font-extrabold">{me.nickname}</span> 님
//             </p>
//             <div className="mt-2 flex items-center gap-2">
//               <button type="button" onClick={() => setInfoOpen(true)}>
//                 나의 정보 확인하기
//               </button>

//               {!linked ? (
//                 <button onClick={() => setLinkOpen(true)}>배팅 연동하기</button>
//               ) : (
//                 <button onClick={() => setConvertOpen(true)} disabled={ptLoading}>
//                   퐁으로 전환하기
//                 </button>
//               )}
//             </div>
//             <div className="mt-3 flex items-center gap-3 text-sm text-neutral-500">
//               일반 퐁 : {me.pong_balance}
//               기부 퐁 : {me.dona_balance}
//             </div>
//             <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">구매 내역 :</div>
//             <div>
//               <PurchaseHistorySection />
//             </div>
//             <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">기부 내역 :</div>
//             <div>
//               <DonationHistorySection />
//             </div>
//             <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">문의 내역 :</div>
//             <ChatlogHistorySection />
//           </div>
//         </div>
//       </div>
//       {/* 모달들 */}
//       <ProfileEditModal
//         open={infoOpen}
//         onClose={() => setInfoOpen(false)}
//         me={me}
//         onSave={async (v: UpdateUserPayload) => {
//           try {
//             await updateUser(v)
//             // 내 정보 다시 가져오도록 SWR 캐시 갱신
//             await mutate('/user/me')
//             setInfoOpen(false)
//           } catch (e: any) {
//             // 에러 처리 (알림/토스트 등)
//             console.error(e)
//             // toast.error(e?.response?.data?.message ?? '수정에 실패했습니다.');
//           }
//         }}
//         onWithdrawDone={async () => {
//           try {
//             await logout()
//           } catch (e) {
//             console.error('logout failed', e)
//           } finally {
//             router.replace('/') // 홈 등으로 이동
//           }
//         }}
//       />
//       <BettingLinkModal
//         open={linkOpen}
//         onClose={() => setLinkOpen(false)}
//         onLinked={async () => {
//           // 모달 내부에서 mutate('/user/me', '/user/find-betting-user') 이미 처리했다면 생략 가능
//           await mutate('/user/me')
//           await mutate('/user/find-betting')
//           setLinkOpen(false)
//         }}
//       />
//       <PongConvertModal
//         open={convertOpen}
//         onClose={() => setConvertOpen(false)}
//         balance={point_balance} // ✅ point_balance 기준
//         onSubmit={async (amt) => {
//           try {
//             await convert(amt) // ✅ 포인트 → 퐁
//             setConvertOpen(false)
//           } catch (e) {
//             console.error(e)
//           }
//         }}
//       />
//     </div>
//   )
// }

// function* pagesFor(total: number, current: number) {
//   const start = Math.max(1, Math.min(current - 2, total - 4))
//   const end = Math.min(total, start + 4)
//   for (let i = start; i <= end; i++) yield i
// }

// function DonationHistorySection() {
//   const [page, setPage] = useState(0) // 0-base
//   const size = 10
//   const { data, error, isLoading } = useMyDonations(page, size)

//   if (isLoading) return <div className="mt-8 text-sm text-gray-500">기부 내역 불러오는 중…</div>
//   if (error) return <div className="mt-8 text-sm text-red-600">기부 내역 조회 실패</div>
//   if (!data || data.empty) return <div className="mt-8 text-sm text-gray-500">기부 내역이 없습니다.</div>

//   return (
//     <div className="mt-8 rounded-xl border">
//       {/* 테이블 */}
//       <table className="w-full table-fixed text-sm">
//         <colgroup>
//           <col className="w-[60px]" />
//           <col />
//           <col className="w-[140px]" />
//           <col className="w-[140px]" />
//         </colgroup>
//         <thead className="bg-gray-50">
//           <tr>
//             <th className="px-4 py-3 text-left">#</th>
//             <th className="px-4 py-3 text-left">내용</th>
//             <th className="px-4 py-3 text-right">금액</th>
//             <th className="px-4 py-3 text-right">날짜</th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.content.map((row: DonationItem, i: number) => (
//             <tr key={row.id} className="border-t">
//               <td className="px-4 py-3">{page * data.size + i + 1}</td>
//               <td className="px-4 py-3 text-gray-600">기부 (info #{row.donation_info_id})</td>
//               <td className="px-4 py-3 text-right font-semibold">{row.amount.toLocaleString()} 퐁</td>
//               <td className="px-4 py-3 text-right text-gray-500">
//                 {/* 서버 응답에 created_at이 없으면 일단 대시 처리 */}-
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {/* 페이지네이션 (1,2,3...) */}
//       <div className="flex items-center justify-center gap-1 border-t p-3">
//         <button
//           className="h-8 rounded px-2 text-sm disabled:opacity-50"
//           onClick={() => setPage((p) => Math.max(0, p - 1))}
//           disabled={data.first}
//         >
//           ◀
//         </button>

//         {Array.from({ length: data.total_pages }).map((_, idx) => (
//           <button
//             key={idx}
//             className={`h-8 rounded px-3 text-sm ${idx === data.number ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
//             onClick={() => setPage(idx)}
//           >
//             {idx + 1}
//           </button>
//         ))}

//         <button
//           className="h-8 rounded px-2 text-sm disabled:opacity-50"
//           onClick={() => setPage((p) => (data.last ? p : p + 1))}
//           disabled={data.last}
//         >
//           ▶
//         </button>
//       </div>
//     </div>
//   )
// }

// function PurchaseHistorySection() {
//   const [page, setPage] = useState(0) // 0-base
//   const size = 10
//   const { data, error, isLoading } = useMyPurchases(page, size)

//   if (isLoading) return <div className="mt-8 text-sm text-gray-500">구매 내역 불러오는 중…</div>
//   if (error) return <div className="mt-8 text-sm text-red-600">구매 내역 조회 실패</div>
//   if (!data || data.empty) return <div className="mt-8 text-sm text-gray-500">구매 내역이 없습니다.</div>

//   return (
//     <div className="mt-8 rounded-xl border">
//       {/* 테이블 */}
//       <table className="w-full table-fixed text-sm">
//         <colgroup>
//           <col className="w-[60px]" />
//           <col />
//           <col className="w-[140px]" />
//           <col className="w-[140px]" />
//         </colgroup>
//         <thead className="bg-gray-50">
//           <tr>
//             <th className="px-4 py-3 text-left">#</th>
//             <th className="px-4 py-3 text-left">내용</th>
//             <th className="px-4 py-3 text-right">금액</th>
//             <th className="px-4 py-3 text-right">날짜</th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.content.map((row: PurchaseItem, i: number) => (
//             <tr key={row.id} className="border-t">
//               <td className="px-4 py-3">{page * data.size + i + 1}</td>
//               <td className="px-4 py-3 text-gray-600">구매 (info #{row.id})</td>
//               <td className="px-4 py-3 text-right font-semibold">{row.price.toLocaleString()}</td>
//               <td className="px-4 py-3 text-right text-gray-500">
//                 {/* 서버 응답에 created_at이 없으면 일단 대시 처리 */}-
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {/* 페이지네이션 (1,2,3...) */}
//       <div className="flex items-center justify-center gap-1 border-t p-3">
//         <button
//           className="h-8 rounded px-2 text-sm disabled:opacity-50"
//           onClick={() => setPage((p) => Math.max(0, p - 1))}
//           disabled={data.first}
//         >
//           ◀
//         </button>

//         {Array.from({ length: data.total_pages }).map((_, idx) => (
//           <button
//             key={idx}
//             className={`h-8 rounded px-3 text-sm ${idx === data.number ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
//             onClick={() => setPage(idx)}
//           >
//             {idx + 1}
//           </button>
//         ))}

//         <button
//           className="h-8 rounded px-2 text-sm disabled:opacity-50"
//           onClick={() => setPage((p) => (data.last ? p : p + 1))}
//           disabled={data.last}
//         >
//           ▶
//         </button>
//       </div>
//     </div>
//   )
// }

// function ChatlogHistorySection() {
//   const [page, setPage] = useState(0) // 1-base
//   const size = 10
//   const { data, error, isLoading } = useMyChatlogs(page, size)

//   // ✅ 상세 모달 상태
//   const [detailOpen, setDetailOpen] = useState(false)
//   const [selectedId, setSelectedId] = useState<number | null>(null)

//   if (isLoading) return <div className="mt-8 text-sm text-gray-500">문의 내역 불러오는 중…</div>
//   if (error) return <div className="mt-8 text-sm text-red-600">문의 내역 조회 실패</div>

//   const rows: ChatlogItem[] = Array.isArray(data) ? (data as any) : ((data as any)?.content ?? [])

//   if (!data || data.empty) return <div>문의 내역이 없습니다.</div>

//   const totalPages = (data as any)?.total_pages ?? 1
//   const currentPage = (data as any)?.number ?? page
//   const isFirst = (data as any)?.first ?? currentPage === 0
//   const isLast = (data as any)?.last ?? true
//   const pageSize = (data as any)?.size ?? size

//   const openDetail = (id: number) => {
//     setSelectedId(id)
//     setDetailOpen(true)
//   }

//   return (
//     <>
//       <div className="mt-8 rounded-xl border">
//         <table className="w-full table-fixed text-sm">
//           <colgroup>
//             <col className="w-[60px]" />
//             <col />
//             <col className="w-[160px]" />
//           </colgroup>
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-3 text-left">#</th>
//               <th className="px-4 py-3 text-left">제목</th>
//               <th className="px-4 py-3 text-right">작성일</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((row: ChatlogItem, i: number) => {
//               const created = row.chat_date ? new Date(row.chat_date).toLocaleString('ko-KR') : '-'
//               return (
//                 <tr key={row.id} className="border-t">
//                   <td className="px-4 py-3">{currentPage * pageSize + i + 1}</td>
//                   <td className="px-4 py-3">
//                     {/* ✅ 제목 클릭 → 모달 오픈 */}
//                     <button
//                       type="button"
//                       onClick={() => openDetail(row.id)}
//                       className="truncate text-left text-blue-600 hover:underline"
//                       title="상세보기"
//                       style={{ maxWidth: '100%' }}
//                     >
//                       {row.title ?? `대화 #${row.id}`}
//                     </button>
//                   </td>
//                   <td className="px-4 py-3 text-right text-gray-500">{created}</td>
//                 </tr>
//               )
//             })}
//           </tbody>
//         </table>

//         {/* 페이지네이션 */}
//         <div className="flex items-center justify-center gap-1 border-t p-3">
//           <button
//             className="h-8 rounded px-2 text-sm disabled:opacity-50"
//             onClick={() => setPage((p) => Math.max(0, p - 1))}
//             disabled={isFirst}
//           >
//             ◀
//           </button>

//           {Array.from({ length: totalPages }).map((_, idx) => (
//             <button
//               key={idx}
//               className={`h-8 rounded px-3 text-sm ${idx === currentPage ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
//               onClick={() => setPage(idx)}
//             >
//               {idx + 1}
//             </button>
//           ))}

//           <button
//             className="h-8 rounded px-2 text-sm disabled:opacity-50"
//             onClick={() => setPage((p) => (isLast ? p : p + 1))}
//             disabled={isLast}
//           >
//             ▶
//           </button>
//         </div>
//       </div>

//       {/* ✅ 상세 모달 */}
//       <ChatlogDetailModal
//         key={selectedId ?? 'none'}
//         open={detailOpen}
//         onClose={() => setDetailOpen(false)}
//         row={selectedId ? rows.find((r) => r.id === selectedId) : undefined}
//       />
//     </>
//   )
// }

'use client'

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
            <Button
              type="button"
              variant="default"
              className="hover:shadow-badge text-primary-black hover:text-primary-white border bg-white font-semibold hover:bg-gray-300"
            >
              나의 정보확인하기
            </Button>
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

      {/* 
          문의내역: title, 
        */}
      {/* 표 박스 */}
      {/* 
        <section className="mt-8">
        <div className="rounded-tr-2xl rounded-b-2xl border-2 border-[var(--color-secondary-royal)] bg-white p-0 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-14" />
                <col />
                <col className="w-40" />
                <col className="w-32" />
              </colgroup>
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="border-b px-4 py-3">#</th>
                  <th className="border-b px-4 py-3">내용</th>
                  <th className="border-b px-4 py-3">잔액(변동)</th>
                  <th className="border-b px-4 py-3">일자</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => (
                  <tr key={r.id} className="text-sm">
                    <td className="border-b px-4 py-3">{r.id}</td>
                    <td className="border-b px-4 py-3 text-gray-700">{r.title}</td>
                    <td className="border-b px-4 py-3">
                      <span>{r.amount}</span>
                      {typeof r.diff === 'number' && (
                        <span
                          className={['ml-1 font-semibold', r.diff >= 0 ? 'text-blue-600' : 'text-rose-500'].join(' ')}
                        >
                          ({r.diff >= 0 ? `+${r.diff}` : r.diff})
                        </span>
                      )}
                    </td>
                    <td className="border-b px-4 py-3 text-gray-500">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-1 p-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1
              const activePage = page === n
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={[
                    'h-8 w-8 rounded-md text-sm font-semibold',
                    activePage ? 'bg-black text-white' : 'border hover:bg-gray-50',
                  ].join(' ')}
                >
                  {n}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
            >
              &gt;
            </button>
          </div>
        </div> </section>*/}
    </div>
  )
}
