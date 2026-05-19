import { Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import './SystemDateTime.css'

function formatSystemDateTime(date) {
  return new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function SystemDateTime() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="system-date-time" title="Fecha y hora del sistema">
      <Clock3 size={15} />
      <span>{formatSystemDateTime(now)}</span>
    </div>
  )
}
