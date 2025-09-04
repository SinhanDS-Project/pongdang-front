'use client'

import Link from 'next/link'

type Props = { title: string; rows: string[][]; ctaHref: string; ctaLabel: string }

export function CtaSection({ title, rows, ctaHref, ctaLabel }: Props) {
  // bounce 타이밍 어긋나게
  const delays = [0, 0.2, 0.4, 0.6, 0.8]

  return (
    <section className="bg-bubble mb-3 flex w-full flex-col items-center gap-y-10 py-16 sm:gap-y-12 sm:py-20 md:mb-6 md:gap-y-16 md:py-24">
      {/* 제목 */}
      <h2 className="text-primary-shinhan text-center text-2xl font-extrabold sm:text-3xl md:text-4xl lg:text-5xl dark:text-white">
        {title}
      </h2>

      {/* 카테고리 라벨들 */}
      <div className="flex flex-col items-center gap-y-6 text-lg font-medium sm:text-xl md:text-2xl lg:text-3xl">
        {rows.map((row, ri) => (
          <div key={ri} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-10 md:gap-x-16">
            {row.map((label, i) => (
              <div
                key={label}
                className="animate-bounce"
                style={{ animationDelay: `${(delays[i % delays.length] + ri * 0.1).toFixed(1)}s` }}
              >
                {label}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* CTA 버튼/링크 */}
      <Link
        href={ctaHref}
        className="text-foreground hover:text-foreground/70 mt-4 text-xl font-bold underline sm:text-2xl md:text-3xl"
      >
        {ctaLabel}
      </Link>
    </section>
  )
}
