import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trackViewEndpoint } from './track-view'
import { viewDedupCache } from '../lib/view-tracker/lru'

// Valid 24-char hex ObjectId for tests
const VALID_REF_ID = '67e2c8d9b500000000000000'

// Default good headers for most tests
const goodHeaders = (overrides: Record<string, string | null> = {}) => {
  const defaults: Record<string, string | null> = {
    origin: 'https://aistudy.com.vn',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
    cookie: null,
  }
  const merged = { ...defaults, ...overrides }
  return {
    get: (name: string) => merged[name.toLowerCase()] ?? null,
  }
}

const makeUpdateOne = (matchedCount = 1, modifiedCount = 1) =>
  vi.fn().mockResolvedValue({ matchedCount, modifiedCount })

const buildReq = ({
  body = { refType: 'exam', refId: VALID_REF_ID },
  headers = goodHeaders(),
  updateOne = makeUpdateOne(),
  collectionName = 'exams',
}: {
  body?: Record<string, unknown>
  headers?: { get: (k: string) => string | null }
  updateOne?: ReturnType<typeof vi.fn>
  collectionName?: string
} = {}) => ({
  json: vi.fn().mockResolvedValue(body),
  headers,
  payload: {
    db: {
      collections: {
        [collectionName]: {
          collection: { updateOne },
        },
      },
    },
  },
})

describe('trackViewEndpoint', () => {
  beforeEach(() => {
    viewDedupCache.clear()
    vi.restoreAllMocks()
  })

  // ---------- 1. New view counted=true + Set-Cookie ----------
  it('counts new view and sets aid cookie when no cookie present', async () => {
    const updateOne = makeUpdateOne()
    const req = buildReq({ updateOne })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.counted).toBe(true)
    expect(updateOne).toHaveBeenCalledTimes(1)
    // $inc field for exam is 'views'
    const [, updateDoc] = updateOne.mock.calls[0]
    expect(updateDoc).toEqual({ $inc: { views: 1 } })
    // Set-Cookie header present with aid=<uuid>
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toMatch(/^aid=/)
    expect(setCookie).toContain('Max-Age=31536000')
  })

  // ---------- 2. Dedup: same aid within window → counted=false ----------
  it('deduplicates view for same aid within TTL window', async () => {
    const updateOne = makeUpdateOne()
    // Pre-seed LRU with a known aid
    const knownAid = 'test-known-aid-uuid-1234'
    const key = `${knownAid}:exam:${VALID_REF_ID}`
    viewDedupCache.set(key, true)

    const req = buildReq({
      headers: goodHeaders({ cookie: `aid=${knownAid}` }),
      updateOne,
    })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.counted).toBe(false)
    expect(body.reason).toBe('deduped')
    expect(updateOne).not.toHaveBeenCalled()
  })

  // ---------- 3. Bot UA blocked ----------
  it('blocks known bot user-agent (Googlebot)', async () => {
    const updateOne = makeUpdateOne()
    const req = buildReq({
      headers: goodHeaders({ 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }),
      updateOne,
    })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.counted).toBe(false)
    expect(body.reason).toBe('bot')
    expect(updateOne).not.toHaveBeenCalled()
  })

  // ---------- 4. Empty / too-short UA blocked ----------
  it('blocks user-agent shorter than 10 characters', async () => {
    const updateOne = makeUpdateOne()
    const req = buildReq({
      headers: goodHeaders({ 'user-agent': 'tiny' }),
      updateOne,
    })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.counted).toBe(false)
    expect(body.reason).toBe('bot')
    expect(updateOne).not.toHaveBeenCalled()
  })

  // ---------- 5. Wrong origin blocked ----------
  it('blocks request from disallowed origin', async () => {
    const updateOne = makeUpdateOne()
    const req = buildReq({
      headers: goodHeaders({ origin: 'https://evil.com' }),
      updateOne,
    })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.counted).toBe(false)
    expect(body.reason).toBe('origin_blocked')
    expect(updateOne).not.toHaveBeenCalled()
  })

  // ---------- 6. Missing origin blocked ----------
  it('blocks request with no Origin header', async () => {
    const updateOne = makeUpdateOne()
    const req = buildReq({
      headers: goodHeaders({ origin: null }),
      updateOne,
    })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.counted).toBe(false)
    expect(body.reason).toBe('origin_blocked')
    expect(updateOne).not.toHaveBeenCalled()
  })

  // ---------- 7. Invalid refType → 400 ----------
  it('returns 400 for unknown refType', async () => {
    const req = buildReq({ body: { refType: 'unknown', refId: VALID_REF_ID } })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid refType')
  })

  // ---------- 8a. refId too short → 400 ----------
  it('returns 400 when refId is too short (< 8 chars)', async () => {
    const req = buildReq({ body: { refType: 'exam', refId: 'short' } })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid refId')
  })

  // ---------- 8b. refId too long → 400 ----------
  it('returns 400 when refId is too long (> 40 chars)', async () => {
    const req = buildReq({ body: { refType: 'exam', refId: 'a'.repeat(41) } })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid refId')
  })

  // ---------- 9. Resource not found → counted=false reason=not_found ----------
  it('returns counted=false reason=not_found when updateOne matches nothing', async () => {
    const updateOne = makeUpdateOne(0, 0)
    const req = buildReq({ updateOne })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.counted).toBe(false)
    expect(body.reason).toBe('not_found')
    expect(updateOne).toHaveBeenCalledTimes(1)
  })

  // ---------- 10. Mongo error → counted=false reason=error ----------
  it('returns counted=false reason=error when updateOne throws', async () => {
    const updateOne = vi.fn().mockRejectedValue(new Error('Mongo connection lost'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const req = buildReq({ updateOne })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.counted).toBe(false)
    expect(body.reason).toBe('error')
    expect(consoleSpy).toHaveBeenCalled()
  })

  // ---------- 11a. FIELD_MAP: post refType → $inc viewCount ----------
  it('uses viewCount field for post refType', async () => {
    const updateOne = makeUpdateOne()
    const req = buildReq({
      body: { refType: 'post', refId: VALID_REF_ID },
      updateOne,
      collectionName: 'posts',
    })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.counted).toBe(true)
    const [, updateDoc] = updateOne.mock.calls[0]
    expect(updateDoc).toEqual({ $inc: { viewCount: 1 } })
  })

  // ---------- 11b. FIELD_MAP: event refType → $inc views ----------
  it('uses views field for event refType', async () => {
    const updateOne = makeUpdateOne()
    const req = buildReq({
      body: { refType: 'event', refId: VALID_REF_ID },
      updateOne,
      collectionName: 'events',
    })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.counted).toBe(true)
    const [, updateDoc] = updateOne.mock.calls[0]
    expect(updateDoc).toEqual({ $inc: { views: 1 } })
  })

  // ---------- 12. Existing aid in cookie: reused, no new Set-Cookie ----------
  it('reuses existing aid from cookie and does not set a new cookie', async () => {
    const existingAid = 'existing-valid-uuid-4567'
    const updateOne = makeUpdateOne()
    const req = buildReq({
      headers: goodHeaders({ cookie: `aid=${existingAid}` }),
      updateOne,
    })
    const res = (await trackViewEndpoint.handler!(req as any)) as Response
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.counted).toBe(true)
    // Cookie already existed — should NOT set a new one
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toBeNull()
    // LRU key should use the existing aid
    const key = `${existingAid}:exam:${VALID_REF_ID}`
    expect(viewDedupCache.has(key)).toBe(true)
  })
})
