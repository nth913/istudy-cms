import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { eventsV1Endpoint } from './events-v1'

const baseEvent = {
  id: 'e1',
  title: 'Test Event',
  short: 'Test',
  submenu: 'thpt-qg',
  subject: 'Tiếng Anh',
  heroEyebrow: 'Mùa thi',
  startAt: '2026-06-27T07:30:00+07:00',
  endAt: '2026-06-27T23:59:00+07:00',
  examEndTime: '2026-06-27T09:30:00+07:00',
  _status: 'published',
  deReady: false,
  dapAnReady: false,
  priority: 50,
  leadDays: 14,
  examRef: null,
  manualPin: { hero: false, popup: false },
  kind: 'live-exam',
  surfaces: ['header-mega'],
}

const makeReq = (overrides: any = {}, ifNoneMatch?: string) => ({
  url: 'http://localhost/api/v1/events',
  payload: {
    find: vi.fn().mockResolvedValue({ docs: [baseEvent], totalDocs: 1, page: 1 }),
  },
  headers: {
    get: vi.fn((k: string) =>
      k.toLowerCase() === 'if-none-match' && ifNoneMatch ? ifNoneMatch : null,
    ),
  },
  ...overrides,
})

describe('eventsV1Endpoint', () => {
  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2026-06-27T08:00:00+07:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 200 with slots + events + updatedAt shape', async () => {
    const req = makeReq()
    const res = (await eventsV1Endpoint.handler!(req as any)) as Response
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('slots')
    expect(body).toHaveProperty('events')
    expect(body).toHaveProperty('updatedAt')
    expect(body.slots).toHaveProperty('hero')
    expect(body.slots).toHaveProperty('popup')
    expect(body.slots).toHaveProperty('megamenuPromos')
  })

  it('events[] only contains ids mentioned in slots', async () => {
    const e1 = { ...baseEvent, id: 'e1', submenu: 'thpt-qg', priority: 10 }
    const e2 = { ...baseEvent, id: 'e2', submenu: 'thpt-qg', priority: 20 } // loser
    const req = makeReq({
      payload: { find: vi.fn().mockResolvedValue({ docs: [e1, e2] }) },
    })
    const res = (await eventsV1Endpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.events).toHaveLength(1) // only e1 (winner of both hero+megamenu)
    expect(body.events[0].id).toBe('e1')
  })

  it('strips BE-internal fields from events[]', async () => {
    const req = makeReq()
    const res = (await eventsV1Endpoint.handler!(req as any)) as Response
    const body = await res.json()
    const event = body.events[0]
    expect(event).not.toHaveProperty('priority')
    expect(event).not.toHaveProperty('leadDays')
    expect(event).not.toHaveProperty('manualPin')
    expect(event).not.toHaveProperty('surfaces')
    expect(event).not.toHaveProperty('_status')
  })

  it('derives examUrl from examRef.slug when populated', async () => {
    const e = { ...baseEvent, examRef: { id: 'x1', slug: 'thpt-qg-2026' } }
    const req = makeReq({
      payload: { find: vi.fn().mockResolvedValue({ docs: [e] }) },
    })
    const res = (await eventsV1Endpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.events[0].examUrl).toBe('/de-thi/thpt-qg-2026')
    expect(body.events[0].answerUrl).toBe('/dap-an/thpt-qg-2026')
  })

  it('falls back to query string URL when examRef missing', async () => {
    const req = makeReq()
    const res = (await eventsV1Endpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.events[0].examUrl).toBe('/de-thi-chi-tiet.html?event=e1')
  })

  it('sets Cache-Control header', async () => {
    const req = makeReq()
    const res = (await eventsV1Endpoint.handler!(req as any)) as Response
    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=60, stale-while-revalidate=120',
    )
  })

  it('sets ETag header on response', async () => {
    const req = makeReq()
    const res = (await eventsV1Endpoint.handler!(req as any)) as Response
    const etag = res.headers.get('ETag')
    expect(etag).toMatch(/^"[a-f0-9]+"$/)
  })

  it('returns 304 when If-None-Match matches current ETag', async () => {
    // First request — get ETag
    const req1 = makeReq()
    const res1 = (await eventsV1Endpoint.handler!(req1 as any)) as Response
    const etag = res1.headers.get('ETag')!

    // Second request — send If-None-Match
    const req2 = makeReq({}, etag)
    const res2 = (await eventsV1Endpoint.handler!(req2 as any)) as Response
    expect(res2.status).toBe(304)
  })

  it('builds waitingUrl with event id', async () => {
    const req = makeReq()
    const res = (await eventsV1Endpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.events[0].waitingUrl).toBe('/cho-de?event=e1')
  })

  it('formats date YYYY-MM-DD and time HH:mm from startAt', async () => {
    const req = makeReq()
    const res = (await eventsV1Endpoint.handler!(req as any)) as Response
    const body = await res.json()
    // Note: depends on TZ — accept format only
    expect(body.events[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(body.events[0].time).toMatch(/^\d{2}:\d{2}$/)
  })
})
