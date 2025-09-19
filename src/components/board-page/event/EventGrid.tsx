import { EVENTS } from './EventList'
import EventCard from './EventCard'

export default function EventGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {EVENTS.map((e, idx) => (
        <EventCard key={e.slug || idx} e={e} />
      ))}
    </div>
  )
}
