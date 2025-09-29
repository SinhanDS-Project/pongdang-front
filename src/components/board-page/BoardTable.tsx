'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Board } from '@/types/board'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Heart } from 'lucide-react'

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
              className={
                sort === 'createdAt'
                  ? 'rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white'
                  : 'rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200'
              }
            >
              최신순
            </button>
            <button
              onClick={() => onSortChange?.('viewCount')}
              className={
                sort === 'viewCount'
                  ? 'rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white'
                  : 'rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200'
              }
            >
              조회수
            </button>
            <button
              onClick={() => onSortChange?.('likeCount')}
              className={
                sort === 'likeCount'
                  ? 'rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white'
                  : 'rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200'
              }
            >
              좋아요
            </button>
          </div>

          {/* 글쓰기 버튼 */}
          <div className="mr-8">
            <button
              onClick={onWriteClick}
              className="rounded-full bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              글쓰기
            </button>
          </div>
        </div>
      )}

      <Table className="w-full table-auto text-sm sm:text-base">
        <TableHeader>
          <TableRow>
            {variant === 'FREE' && (
              <>
                <TableHead className="text-center">No</TableHead>
                <TableHead className="text-center">제목</TableHead>
                <TableHead className="text-center">작성자</TableHead>
                <TableHead className="hidden text-center sm:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span>조회수</span>
                  </div>
                </TableHead>
                <TableHead className="hidden text-center sm:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span>좋아요</span>
                  </div>
                </TableHead>
                <TableHead className="hidden text-center sm:table-cell">작성일</TableHead>
              </>
            )}

            {variant === 'NOTICE' && (
              <>
                <TableHead className="hidden text-center sm:table-cell">No</TableHead>
                <TableHead className="hidden text-center sm:table-cell">제목</TableHead>
                <TableHead className="hidden text-center sm:table-cell">작성자</TableHead>
                <TableHead className="hidden text-center sm:table-cell">작성일</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item, idx) => {
            const no = (page - 1) * pageSize + idx + 1
            const href = `/board/${item.id}?category=${variant}`

            return (
              <TableRow key={item.id} className="cursor-pointer hover:bg-gray-100" onClick={() => router.push(href)}>
                <TableCell className="text-center">{no}</TableCell>
                <TableCell className="max-w-[320px] truncate text-center whitespace-nowrap">
                  <Link href={href} className="hover:underline">
                    {item.title}
                  </Link>
                  {variant === 'FREE' && item.reply_count !== undefined && (
                    <span className="ml-2 text-sm text-gray-500">[{item.reply_count}]</span>
                  )}
                </TableCell>

                <TableCell className="text-center">{item.nickname}</TableCell>

                {variant === 'FREE' && (
                  <>
                    <TableCell className="hidden text-center sm:table-cell">
                      <div className="inline-flex items-center justify-center gap-1 text-gray-600">
                        <Eye className="h-4 w-4 text-gray-500" />
                        <span>{item.view_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-center sm:table-cell">
                      <div className="inline-flex items-center justify-center gap-1 text-pink-600">
                        <Heart className="h-4 w-4" />
                        <span>{item.like_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-center text-gray-500 sm:table-cell">
                      {formatDate(item.created_at)}
                    </TableCell>
                  </>
                )}

                {variant === 'NOTICE' && (
                  <TableCell className="hidden text-center text-gray-500 sm:table-cell">
                    {formatDate(item.created_at)}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </section>
  )
}
