'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Board } from '@/types/board'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Props = {
  items: Board[]
  page: number
  pageSize: number
  basePath?: string
  variant: 'FREE' | 'NOTICE'
  sort?: 'createdAt' | 'viewCount' | 'likeCount'
  onSortChange?: (sort: 'createdAt' | 'viewCount' | 'likeCount') => void
  onWriteClick?: () => void
}

function formatDate(input: string | Date) {
  const d = input instanceof Date ? input : new Date(input)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ko-KR')
}

export function BoardTable({ items, page, pageSize, variant, sort, onSortChange, onWriteClick }: Props) {
  const router = useRouter()

  return (
    <section className="mb-6">
      {/* 자유게시판 전용 상단 툴바 */}
      {variant === 'FREE' && (
        <div className="mb-3 flex items-center justify-between">
          {/* 정렬 버튼 */}
          <div className="ml-4 flex gap-2">
            <button
              onClick={() => onSortChange?.('createdAt')}
              className={[
                'rounded px-3 py-1 text-sm font-medium',
                sort === 'createdAt'
                  ? 'bg-[var(--color-secondary-royal)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              최신순
            </button>
            <button
              onClick={() => onSortChange?.('viewCount')}
              className={[
                'rounded px-3 py-1 text-sm font-medium',
                sort === 'viewCount'
                  ? 'bg-[var(--color-secondary-royal)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              조회수
            </button>
            <button
              onClick={() => onSortChange?.('likeCount')}
              className={[
                'rounded px-3 py-1 text-sm font-medium',
                sort === 'likeCount'
                  ? 'bg-[var(--color-secondary-royal)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              좋아요
            </button>
          </div>

          {/* 글쓰기 버튼 */}
          <div className="mr-8">
            <button
              onClick={onWriteClick}
              className={[
                'rounded-full px-5 py-2.5 font-medium shadow-sm transition',
                'border-[var(--color-secondary-royal)] bg-[var(--color-secondary-royal)] text-white',
                'hover:border-[var(--color-secondary-navy)] hover:bg-[var(--color-secondary-navy)]',
                'focus:ring-2 focus:ring-[var(--color-secondary-royal)] focus:ring-offset-2 focus:outline-none',
              ].join(' ')}
            >
              글쓰기
            </button>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <Table className="w-full table-auto text-center text-sm sm:text-base">
        {variant === 'FREE' && (
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>작성자</TableHead>
              <TableHead>조회수</TableHead>
              <TableHead>좋아요</TableHead>
              <TableHead>작성일</TableHead>
            </TableRow>
          </TableHeader>
        )}

        <TableBody>
          {items.map((item, idx) => {
            const no = (page - 1) * pageSize + idx + 1
            const href = `/board/${item.id}?category=${variant}`

            return (
              <TableRow
                key={item.id}
                className="hover:bg-muted/60 cursor-pointer"
                onClick={() => router.push(href)}
                role="link"
                tabIndex={0}
              >
                <TableCell>{no}</TableCell>

                <TableCell className="max-w-[320px] truncate text-center whitespace-nowrap">
                  <Link href={href} className="inline-block hover:underline">
                    {item.title}
                  </Link>
                  {variant === 'FREE' && item.reply_count !== undefined && (
                    <span className="ml-2 text-sm text-gray-500">[{item.reply_count}]</span>
                  )}
                </TableCell>

                <TableCell className="text-center">{item.nickname}</TableCell>

                {variant === 'FREE' && (
                  <>
                    <TableCell className="text-right">{item.view_count}</TableCell>
                    <TableCell className="text-right">{item.like_count}</TableCell>
                  </>
                )}

                <TableCell className="text-muted-foreground hidden text-right sm:table-cell">
                  {formatDate(item.created_at)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={variant === 'FREE' ? 6 : 4} />
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  )
}
