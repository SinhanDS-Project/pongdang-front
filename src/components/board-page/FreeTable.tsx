'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Board } from '@/components/board-page/types'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Props = {
  items: Array<
    Pick<Board, 'id' | 'title' | 'nickname' | 'view_count' | 'like_count' | 'category'> & { created_at: string | Date }
  >
  page: number
  pageSize: number
  basePath?: string
  title?: string
}

function formatDate(input: string | Date) {
  const d = input instanceof Date ? input : new Date(input)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ko-KR')
}

// 공통 폭 클래스 (헤더/바디에 모두 적용)
const W = {
  no: 'w-16 sm:w-20',
  author: 'w-28 md:w-32',
  num: 'w-24',
  date: 'md:w-40', // sm 이상에서만 보이므로 w는 md부터
}

export function FreeTable({ items, page, pageSize, basePath = '/board', title }: Props) {
  const router = useRouter()

  return (
    <section className="mb-6">
      {title && <h2 className="mb-3 text-center text-xl font-bold">{title}</h2>}

      {/* table-auto로 두고, 각 셀에 동일 폭을 지정 */}
      <Table className="w-full table-auto text-center text-sm sm:text-base">
        <TableHeader>
          <TableRow>
            <TableHead className={`${W.no} pl-6 text-left sm:pl-8`}>No</TableHead>
            <TableHead className="text-center">제목</TableHead>
            <TableHead className={`${W.author} text-center`}>작성자</TableHead>
            <TableHead className={`${W.num} pr-3 text-right`}>조회수</TableHead>
            <TableHead className={`${W.num} pr-3 text-right`}>좋아요</TableHead>
            <TableHead className={`hidden sm:table-cell ${W.date} pr-13 text-right`}>작성일</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item, idx) => {
            const no = (page - 1) * pageSize + idx + 1
            const href = `${basePath}/${item.id}`
            return (
              <TableRow
                key={`${item.id}-${idx}`}
                className="hover:bg-muted/60 cursor-pointer"
                role="link"
                tabIndex={0}
                onClick={() => router.push(href)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(href)}
              >
                <TableCell className={`${W.no} py-4 pl-6 text-left tabular-nums sm:pl-8`}>{no}</TableCell>

                <TableCell className="max-w-[320px] truncate text-center whitespace-nowrap">
                  <Link href={href} className="inline-block hover:underline">
                    {item.title}
                  </Link>
                </TableCell>

                <TableCell className={`${W.author} text-center whitespace-nowrap`}>{item.nickname}</TableCell>

                <TableCell className={`${W.num} pr-3 text-right tabular-nums`}>{item.view_count}</TableCell>
                <TableCell className={`${W.num} pr-4 text-right tabular-nums`}>{item.like_count}</TableCell>

                <TableCell className={`hidden sm:table-cell ${W.date} text-muted-foreground pr-8 text-right`}>
                  {formatDate(item.created_at)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={6} />
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  )
}
