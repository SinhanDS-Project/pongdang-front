'use client'

import { useMemo, useCallback, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/net/client-axios'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

// SSR 끄고 동적 import
const ReactQuill = dynamic(() => import('react-quill-new').then((m) => m.default), { ssr: false })

function Body() {
  const router = useRouter()
  const sp = useSearchParams()
  const cat = sp.get('cat')?.toUpperCase() || 'FREE' // URL에서 cat 가져오고 기본은 FREE

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const formats = useMemo(
    () => [
      'size',
      'color',
      'background',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
      'list',
      'indent',
      'image',
    ],
    [],
  )

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ size: ['small', false, 'large', 'huge'] }],
          [{ color: [] }, { background: [] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          ['image'],
        ],
      },
    }),
    [],
  )

  const onChangeEditorValue = useCallback((v: string) => setContent(v), [])

  // 내용은 최소 한 글자 필요(HTML 태그 제거 후)
  const plainText = useMemo(() => content.replace(/<[^>]+>/g, '').trim(), [content])
  const titleEmpty = title.trim().length === 0

  // ✅ 최종 onSubmit
  const onSubmit = async () => {
    if (titleEmpty) return alert('제목을 입력해주세요.')
    if (!plainText) return alert('내용을 입력해주세요.')

    try {
      await api.post('/api/board', {
        title,
        content,
        category: cat, // URL에서 넘어온 cat 값 (예: FREE, NOTICE, EVENT 등)
      })
      alert('게시글이 등록되었습니다.')
      router.push('/board')
    } catch (e) {
      alert('등록 중 오류가 발생했습니다.')
    }
  }

  return (
    <main className="mx-auto max-w-6xl">
      <section className="relative rounded-2xl border bg-gray-50 p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
          {/* 왼쪽: 에디터 영역 */}
          <div className="rounded-2xl border bg-white p-4 sm:p-5">
            {/* 제목 입력 */}
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-base transition outline-none focus:ring-2 focus:ring-[var(--color-secondary-sky)]"
            />

            {/* 에디터 */}
            <div className="mt-5">
              <div className="quill-wrap overflow-hidden rounded-xl border border-gray-200" style={{ height: 500 }}>
                <ReactQuill
                  theme="snow"
                  value={content}
                  formats={formats}
                  modules={modules}
                  onChange={onChangeEditorValue}
                  style={{ height: '100%' }}
                />
              </div>

              <style jsx global>{`
                .quill-wrap .ql-container {
                  height: calc(100% - 42px);
                }
                .quill-wrap .ql-editor {
                  height: 100%;
                  overflow-y: auto;
                }
              `}</style>

              <p className="mt-2 text-xs text-gray-500">최대 2048자까지 쓸 수 있습니다</p>
            </div>
          </div>

          {/* 오른쪽: 버튼 패널 */}
          <div className="flex flex-col items-end justify-end gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={titleEmpty || !plainText}
              className="w-full rounded-full bg-[var(--color-secondary-royal)] px-6 py-3 text-base font-bold text-white transition hover:bg-[var(--color-secondary-navy)] disabled:opacity-60 lg:w-[220px]"
            >
              등록하기
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full rounded-full bg-[var(--color-secondary-light)] px-6 py-3 text-base font-bold text-[var(--color-secondary-navy)] transition hover:bg-[var(--color-secondary-sky)] hover:text-white lg:w-[220px]"
            >
              취소하기
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Body />
    </Suspense>
  )
}