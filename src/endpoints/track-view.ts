import type { Endpoint, PayloadRequest } from 'payload'
import { randomUUID } from 'crypto'
import { ObjectId } from 'mongodb'
import { viewDedupCache } from '../lib/view-tracker/lru'

const REF_TYPES = ['exam', 'post', 'event', 'book'] as const
type RefType = (typeof REF_TYPES)[number]

const FIELD_MAP: Record<RefType, string> = {
  exam: 'views',
  post: 'viewCount', // Posts uses different field name (existing, do not rename)
  event: 'views',
  book: 'views',
}

const COLLECTION_MAP: Record<RefType, string> = {
  exam: 'exams',
  post: 'posts',
  event: 'events',
  book: 'books',
}

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternal|preview|fetch|monitor|wget|curl|python-urllib|axios|node-fetch|embedly/i

function buildAllowedOrigins(): Array<string | RegExp> {
  const list: Array<string | RegExp> = [
    'https://aistudy.com.vn',
    /^https:\/\/.*\.aistudy\.com\.vn$/,
  ]
  if (process.env.NODE_ENV !== 'production') {
    list.push('http://localhost:3000', 'http://localhost:3001')
  }
  return list
}

function originAllowed(origin: string | null): boolean {
  if (!origin) return false
  const allowed = buildAllowedOrigins()
  return allowed.some((o) =>
    typeof o === 'string' ? o === origin : o.test(origin),
  )
}

function parseAidFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/(?:^|;\s*)aid=([^;]+)/)
  return match?.[1] ?? null
}

function buildSetCookieHeader(aid: string): string {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [
    `aid=${aid}`,
    'Path=/',
    'Max-Age=31536000',
    'HttpOnly',
    isProd ? 'SameSite=None' : 'SameSite=Lax',
    isProd ? 'Secure' : '',
    isProd ? 'Domain=.aistudy.com.vn' : '',
  ].filter(Boolean)
  return parts.join('; ')
}

type TrackViewBody = { refType?: unknown; refId?: unknown }

async function parseBody(req: PayloadRequest): Promise<TrackViewBody> {
  // sendBeacon sends Blob — body via .text() or .json() depending on req shape
  try {
    if (typeof req.json === 'function') {
      return (await req.json()) as TrackViewBody
    }
  } catch {
    /* fall through to text */
  }
  try {
    if (typeof req.text === 'function') {
      const txt = await req.text()
      return txt ? (JSON.parse(txt) as TrackViewBody) : {}
    }
  } catch {
    /* ignore */
  }
  return {}
}

export const trackViewEndpoint: Endpoint = {
  path: '/track-view',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const body = await parseBody(req)
    const refType = body.refType
    const refId = body.refId

    if (
      typeof refType !== 'string' ||
      !REF_TYPES.includes(refType as RefType)
    ) {
      return Response.json({ error: 'Invalid refType' }, { status: 400 })
    }
    if (typeof refId !== 'string' || refId.length < 8 || refId.length > 40) {
      return Response.json({ error: 'Invalid refId' }, { status: 400 })
    }

    const origin = req.headers.get('origin')
    if (!originAllowed(origin)) {
      return Response.json(
        { ok: true, counted: false, reason: 'origin_blocked' },
        { status: 200 },
      )
    }

    const ua = req.headers.get('user-agent') ?? ''
    if (BOT_UA.test(ua) || ua.length < 10) {
      return Response.json(
        { ok: true, counted: false, reason: 'bot' },
        { status: 200 },
      )
    }

    const cookieHeader = req.headers.get('cookie')
    let aid = parseAidFromCookie(cookieHeader)
    const cookieIsNew = !aid
    if (!aid) aid = randomUUID()

    const key = `${aid}:${refType}:${refId}`
    if (viewDedupCache.has(key)) {
      return withCookie(
        Response.json({ ok: true, counted: false, reason: 'deduped' }),
        cookieIsNew,
        aid,
      )
    }
    viewDedupCache.set(key, true)

    const collectionName = COLLECTION_MAP[refType as RefType]
    const fieldName = FIELD_MAP[refType as RefType]

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const NativeColl = (req.payload.db as any).collections[collectionName]
      if (!NativeColl?.collection) {
        throw new Error(`Mongo collection not found: ${collectionName}`)
      }
      const result = await NativeColl.collection.updateOne(
        { _id: new ObjectId(refId), _status: 'published' },
        { $inc: { [fieldName]: 1 } },
      )
      if (result.matchedCount === 0) {
        return withCookie(
          Response.json({ ok: true, counted: false, reason: 'not_found' }),
          cookieIsNew,
          aid,
        )
      }
    } catch (err) {
      console.error('[track-view] $inc failed:', err)
      return withCookie(
        Response.json({ ok: true, counted: false, reason: 'error' }),
        cookieIsNew,
        aid,
      )
    }

    return withCookie(
      Response.json({ ok: true, counted: true }),
      cookieIsNew,
      aid,
    )
  },
}

function withCookie(res: Response, isNew: boolean, aid: string): Response {
  if (!isNew) return res
  res.headers.append('Set-Cookie', buildSetCookieHeader(aid))
  return res
}
