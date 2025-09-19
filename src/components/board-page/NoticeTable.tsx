'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Board } from '@/components/board-page/types'
import { Table, TableBody, TableCell, TableFooter, TableRow } from '@/components/ui/table'

type Props = {
  items: Array<{
    id: Board['id']
    title: Board['title']
    category: Board['category']
    created_at: string | Date
    nickname: Board['nickname']
  }>
  page: number
  pageSize: number
  basePath?: string
  title?: string
}

function formatDate(input: string | Date) {
  const d = input instanceof Date ? input : new Date(input)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ko-KR')
}

export function NoticeTable({ items, page, pageSize, basePath = '/board' }: Props) {
  const router = useRouter()

  return (
    <section className="mb-6">
      <Table className="overflow-hidden text-center text-sm sm:text-base">
        <TableBody>
          {items.map((item, idx) => {
            const no = (page - 1) * pageSize + idx + 1
            const href = `/board/${item.id}`

            return (
              <TableRow
                key={item.id}
                className="hover:bg-muted/60 cursor-pointer"
                role="link"
                tabIndex={0}
                onClick={() => router.push(href)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(href)}
              >
                {/* No */}
                <TableCell className="py-4">{no}</TableCell>

                {/* 제목 */}
                <TableCell className="max-w-[360px] truncate text-center">{item.title}</TableCell>

                <TableCell className="w-28 truncate text-center md:w-32">{item.nickname}</TableCell>

                {/* 작성일: 왼쪽 정렬로 당김 */}
                <TableCell className="text-muted-foreground hidden pl-6 sm:table-cell sm:pl-10">
                  {formatDate(item.created_at)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} />
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  )
}
