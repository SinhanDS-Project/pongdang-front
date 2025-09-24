'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { SectionTitle } from '@/components/SectionTitle'
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from '@/components/ui/table'

export type NoticeItem = {
  id: number
  title: string
  category: string
  content: string
  nickname: string
  created_at: string
  view_count: number
  user_id: number
}

export function NoticeSection({ items }: { items: NoticeItem[] }) {
  const router = useRouter()

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0] // "2025-09-03"
  }

  return (
    <section className="mb-8">
      {/*  섹션 타이틀은 공지사항 목록 페이지로 이동 */}
      <SectionTitle href="/board/notice" title="퐁당퐁당 소식" />

      <Table className="overflow-hidden text-center text-sm sm:text-base">
        <TableHeader>
          <TableRow></TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-muted/60 cursor-pointer"
              role="link"
              tabIndex={0}
              //  행 클릭 → /board/[id]
              onClick={() => router.push(`/board/${item.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/board/${item.id}`)}
            >
              <TableCell className="w-28 py-4 md:w-40">{item.category === 'NOTICE' ? '공지사항' : '기타'}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {/*  제목 클릭도 /board/[id] */}
                <Link href={`/board/${item.id}`} className="hover:underline">
                  {item.title}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground hidden w-28 py-3 sm:table-cell md:w-40">
                {formatDate(item.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow></TableRow>
        </TableFooter>
      </Table>
    </section>
  )
}
