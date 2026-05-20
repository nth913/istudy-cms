import type { Endpoint, PayloadRequest } from 'payload'
import crypto from 'node:crypto'
import type { Event } from '../payload-types'
import { pickSlots } from '../lib/event-slots'

type PublicEvent = {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  examEndTime: string | null // HH:mm
  label: string
  short: string
  submenu: string
  subject: string
  heroEyebrow: string
  deReady: boolean
  dapAnReady: boolean
  examUrl: string
  answerUrl: string
  waitingUrl: string
}

function formatYmd(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function formatHm(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function deriveUrls(e: Event): {
  examUrl: string
  answerUrl: string
  waitingUrl: string
} {
  const examRef = e.examRef
  let examSlug: string | undefined
  if (examRef && typeof examRef === 'object' && 'slug' in examRef) {
    examSlug = (examRef as { slug?: string }).slug ?? undefined
  }
  return {
    examUrl: examSlug
      ? `/de-thi/${examSlug}`
      : `/de-thi-chi-tiet.html?event=${e.id}`,
    answerUrl: examSlug
      ? `/dap-an/${examSlug}`
      : `/dap-an.html?event=${e.id}`,
    waitingUrl: `/cho-de?event=${e.id}`,
  }
}

function toPublicEvent(e: Event): PublicEvent {
  const urls = deriveUrls(e)
  return {
    id: String(e.id),
    date: formatYmd(e.startAt),
    time: formatHm(e.startAt),
    examEndTime: e.examEndTime ? formatHm(e.examEndTime) : null,
    label: e.title,
    short: e.short || e.title,
    submenu: (e.submenu as string) || '',
    subject: e.subject || 'Tiếng Anh',
    heroEyebrow: e.heroEyebrow || 'Sự kiện sắp diễn ra',
    deReady: e.deReady === true,
    dapAnReady: e.dapAnReady === true,
    ...urls,
  }
}

export const eventsV1Endpoint: Endpoint = {
  path: '/v1/events',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    // Fetch all published events with depth=1 to populate examRef
    const result = await req.payload.find({
      collection: 'events',
      where: { _status: { equals: 'published' } },
      limit: 100,
      depth: 1,
    })

    const events: Event[] = result.docs as Event[]
    const now = new Date()
    const slots = pickSlots(events, now)

    // Build events array — only events mentioned in slots
    const mentionedIds = new Set<string>()
    if (slots.hero) mentionedIds.add(slots.hero)
    if (slots.popup) mentionedIds.add(slots.popup)
    for (const id of Object.values(slots.megamenuPromos)) mentionedIds.add(id)

    const publicEvents = events
      .filter((e) => mentionedIds.has(String(e.id)))
      .map(toPublicEvent)

    const updatedAt = now.toISOString()

    const body = { slots, events: publicEvents, updatedAt }
    const json = JSON.stringify(body)

    // ETag = sha256 hash of slots + event ids (stable across requests with same data)
    const etagSource = JSON.stringify({
      slots,
      ids: publicEvents.map((e) => e.id),
    })
    const etag = `"${crypto
      .createHash('sha256')
      .update(etagSource)
      .digest('hex')
      .slice(0, 16)}"`

    // Check If-None-Match
    const ifNoneMatch = req.headers?.get?.('if-none-match') ?? null
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        },
      })
    }

    return new Response(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        ETag: etag,
      },
    })
  },
}
