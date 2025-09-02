import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export default function MainHome() {
  return (
    <div className="lg:px-8) container mx-auto px-4 md:px-6">
      {/* 배너 슬라이더 */}
      <Carousel className="mb-4 w-full">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-3/1 items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* 최신 알림 텍스트 바 */}
      <div className="shadow-badge mb-8 rounded-full px-8 py-2 text-base">작은 퐁 하나가 내일의 큰 혜택이 됩니다</div>
    </div>
  )
}
