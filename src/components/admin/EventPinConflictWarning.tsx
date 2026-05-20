'use client'
import React, { useEffect, useState } from 'react'

type Props = {
  doc: {
    id?: string
    manualPin?: { hero?: boolean; popup?: boolean }
    priority?: number
  }
}

export const EventPinConflictWarning: React.FC<Props> = ({ doc }) => {
  const [conflicts, setConflicts] = useState<Array<{
    slot: 'hero' | 'popup'
    winnerTitle: string
    winnerPriority?: number
  }>>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!doc?.id) return
    // Only check if current event is pinned to anything
    const isPinned = doc.manualPin?.hero || doc.manualPin?.popup
    if (!isPinned) {
      setLoaded(true)
      return
    }

    const check = async () => {
      try {
        // Fetch all published events with manualPin
        const res = await fetch(`/api/events?where[_status][equals]=published&depth=0&limit=100`, {
          credentials: 'include',
        })
        if (!res.ok) {
          setLoaded(true)
          return
        }
        const body = await res.json()
        const all: any[] = body.docs || []

        const result: typeof conflicts = []

        for (const slot of ['hero', 'popup'] as const) {
          if (!doc.manualPin?.[slot]) continue
          const pinnedHere = all.filter(e =>
            String(e.id) !== String(doc.id) && e.manualPin?.[slot] === true
          )
          if (pinnedHere.length === 0) continue

          const myPriority = doc.priority ?? 99
          const lowerPriority = pinnedHere.filter(e => (e.priority ?? 99) < myPriority)
          if (lowerPriority.length === 0) continue

          const winner = lowerPriority.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))[0]
          result.push({
            slot,
            winnerTitle: winner.title || winner.id,
            winnerPriority: winner.priority,
          })
        }

        setConflicts(result)
        setLoaded(true)
      } catch {
        setLoaded(true)
      }
    }
    void check()
  }, [doc?.id, doc?.manualPin?.hero, doc?.manualPin?.popup, doc?.priority])

  if (!loaded || conflicts.length === 0) return null

  return (
    <div style={{
      padding: 12,
      background: '#fef3c7',
      border: '1px solid #fde68a',
      borderRadius: 8,
      marginBottom: 12,
      fontSize: 13,
      color: '#92400e',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ Pin conflict</div>
      {conflicts.map(c => (
        <div key={c.slot} style={{ marginBottom: 4 }}>
          Slot <b>{c.slot}</b>: Event "<b>{c.winnerTitle}</b>" (priority={c.winnerPriority}) đang chiếm. Event hiện tại pin nhưng bị thua do priority cao hơn.
        </div>
      ))}
      <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8 }}>
        Để event này chiếm slot, hạ priority xuống thấp hơn winner.
      </div>
    </div>
  )
}

export default EventPinConflictWarning
