import type { Event } from '../payload-types'

export type SlotsResult = {
  hero: string | null
  popup: string | null
  megamenuPromos: Record<string, string>
}

const FRESH_DAYS = 7
const DAY_MS = 86_400_000
const DEFAULT_LEAD_DAYS = 14
const DEFAULT_PRIORITY = 99
const POST_END_GRACE_DAYS = 14

export function isActive(e: Event, now: Date = new Date()): boolean {
  if (e._status !== 'published') return false
  if (!e.startAt || !e.endAt) return false
  const start = new Date(e.startAt).getTime()
  const end = new Date(e.endAt).getTime()
  const leadMs = ((e.leadDays as number | undefined) ?? DEFAULT_LEAD_DAYS) * DAY_MS
  const t = now.getTime()
  return t >= start - leadMs && t <= end + POST_END_GRACE_DAYS * DAY_MS
}

export function pickHero(events: Event[], now: Date = new Date()): string | null {
  const active = events.filter((e) => isActive(e, now))
  // Q2 decision: pinned events filter first, then priority asc tiebreak
  const pinned = active.filter((e) => e.manualPin?.hero === true)
  const pool = pinned.length > 0 ? pinned : active

  const sorted = [...pool].sort(
    (a, b) =>
      ((a.priority as number | undefined) ?? DEFAULT_PRIORITY) -
        ((b.priority as number | undefined) ?? DEFAULT_PRIORITY) ||
      new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime(),
  )
  return sorted[0]?.id != null ? String(sorted[0].id) : null
}

export function pickPopup(events: Event[], now: Date = new Date()): string | null {
  const active = events.filter((e) => isActive(e, now))

  // Manual pin
  const pinned = active.filter((e) => e.manualPin?.popup === true)
  if (pinned.length > 0) {
    const sorted = [...pinned].sort(
      (a, b) =>
        ((a.priority as number | undefined) ?? DEFAULT_PRIORITY) -
        ((b.priority as number | undefined) ?? DEFAULT_PRIORITY),
    )
    return String(sorted[0].id)
  }

  // Fresh content window 7 days + state ∈ {de, dap-an}
  const fresh = active.filter((e) => {
    if (!e.examEndTime) return false
    const sinceEnd = (now.getTime() - new Date(e.examEndTime).getTime()) / DAY_MS
    if (sinceEnd < 0 || sinceEnd > FRESH_DAYS) return false
    return e.deReady === true || e.dapAnReady === true
  })

  if (fresh.length > 0) {
    // Sort: dap-an > de, then sinceEnd ASC, then priority ASC
    const sorted = [...fresh].sort((a, b) => {
      const stateA = a.dapAnReady === true ? 0 : 1
      const stateB = b.dapAnReady === true ? 0 : 1
      if (stateA !== stateB) return stateA - stateB
      const sinceA = now.getTime() - new Date(a.examEndTime!).getTime()
      const sinceB = now.getTime() - new Date(b.examEndTime!).getTime()
      if (sinceA !== sinceB) return sinceA - sinceB
      return (
        ((a.priority as number | undefined) ?? DEFAULT_PRIORITY) -
        ((b.priority as number | undefined) ?? DEFAULT_PRIORITY)
      )
    })
    return String(sorted[0].id)
  }

  // Fallback: hero
  return pickHero(events, now)
}

export function pickMegamenuPromos(
  events: Event[],
  now: Date = new Date(),
): Record<string, string> {
  const active = events.filter((e) => isActive(e, now))
  const result: Record<string, string> = {}

  const bySubmenu = new Map<string, Event[]>()
  for (const e of active) {
    if (!e.submenu) continue
    const list = bySubmenu.get(e.submenu) ?? []
    list.push(e)
    bySubmenu.set(e.submenu, list)
  }

  for (const [submenu, list] of bySubmenu) {
    const sorted = [...list].sort(
      (a, b) =>
        ((a.priority as number | undefined) ?? DEFAULT_PRIORITY) -
          ((b.priority as number | undefined) ?? DEFAULT_PRIORITY) ||
        new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime(),
    )
    if (sorted[0]) result[submenu] = String(sorted[0].id)
  }
  return result
}

export function pickSlots(events: Event[], now: Date = new Date()): SlotsResult {
  return {
    hero: pickHero(events, now),
    popup: pickPopup(events, now),
    megamenuPromos: pickMegamenuPromos(events, now),
  }
}

export type PinConflict = {
  slot: 'hero' | 'popup'
  winner: string
  losers: string[]
}

export function detectPinConflicts(events: Event[]): PinConflict[] {
  const conflicts: PinConflict[] = []
  for (const slot of ['hero', 'popup'] as const) {
    const pinned = events.filter(
      (e) => e._status === 'published' && e.manualPin?.[slot] === true,
    )
    if (pinned.length < 2) continue
    const sorted = [...pinned].sort(
      (a, b) =>
        ((a.priority as number | undefined) ?? DEFAULT_PRIORITY) -
        ((b.priority as number | undefined) ?? DEFAULT_PRIORITY),
    )
    conflicts.push({
      slot,
      winner: String(sorted[0].id),
      losers: sorted.slice(1).map((e) => String(e.id)),
    })
  }
  return conflicts
}
