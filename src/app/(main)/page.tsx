import { AlertBar } from '@/components/main-page/AlertBar'
import { Banner, BannerCarousel } from '@/components/main-page/BannerCarousel'
import { CtaSection } from '@/components/main-page/CtaSection'
import { NoticeItem, NoticeSection } from '@/components/main-page/NoticeSection'
import { StoreItem, StoreSection } from '@/components/main-page/StoreSection'
import { serverFetchJSON } from '@/lib/net/server-fetch'

export const revalidate = 60 // 페이지 캐시 재생성 주기 (초)

export default async function MainHome() {
  const [bannerResponse, storeResponse, noticeResponse] = await Promise.allSettled([
    serverFetchJSON<{ banners: Banner[] }>('/api/content/banner/list', { auth: 'none' }),
    serverFetchJSON<{ content: StoreItem[] }>('/api/store/product?page=1&size=4', { auth: 'none' }),
    serverFetchJSON<{ boards: { content: NoticeItem[] } }>('/api/board?category=NOTICE&page=1&size=5', {
      auth: 'none',
    }),
  ])

  const banners =
    bannerResponse.status === 'fulfilled'
      ? bannerResponse.value.banners
      : Array.from({ length: 3 }).map((_, i) => ({
          id: `${i + 1}`,
          title: `Placeholder Banner ${i + 1}`,
          image_path: '/placeholder-banner.png',
          banner_link_url: '#',
          description: 'This is a placeholder banner',
        }))

  const storeItems =
    storeResponse.status === 'fulfilled'
      ? storeResponse.value.content
      : Array.from({ length: 4 }).map((_, index) => ({
          id: index + 1,
          name: `product ${index + 1}`,
          price: 0,
          img: null, // 적절한 플레이스홀더 이미지 경로
          product_type: 'GIFT',
        }))

  const noticeItems =
    noticeResponse.status === 'fulfilled'
      ? noticeResponse.value.boards.content
      : Array.from({ length: 5 }).map((_, index) => ({
          id: index + 1,
          title: `공지사항 제목 ${index + 1}`,
          category: 'NOTICE',
          content: 'This is a placeholder notice content',
          nickname: '관리자',
          created_at: `2024-10-0${index + 1}`,
          view_count: 0,
          user_id: 0,
        }))

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      <BannerCarousel banners={banners} />
      <AlertBar message="작은 퐁 하나가 내일의 큰 혜택이 됩니다" />
      <CtaSection
        title="나에게 맞는 금융은 뭐가 있을까?"
        rows={
          [
            ['저축', '투자', '대출', '카드', '자산관리'],
            ['소비패턴', '절약', '보험', '연금', '주거/부동산'],
          ] as string[][]
        }
        ctaHref="/report"
        ctaLabel="나의 금융 소비에 맞는 AI 추천 받으러 가기"
      />
      <StoreSection items={storeItems} />
      <NoticeSection items={noticeItems} />
    </div>
  )
}
