// app/(main)/board/event/page.tsx
import EventGrid from '@/components/board-page/event/EventGrid'

export default function EventPage() {
  return (
    <section className="space-y-4">
      <h2 className="sr-only">이벤트 선택</h2>
      <EventGrid />
    </section>
  )
}
