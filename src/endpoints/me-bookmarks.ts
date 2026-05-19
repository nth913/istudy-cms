import type { Endpoint } from 'payload'
import { ensureAnonId } from '../lib/anon-cookie'

const COOKIE_OPTS = `HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`

export const meBookmarks: Endpoint = {
  path: '/v1/me/bookmarks',
  method: 'get',
  handler: async (req) => {
    const secret = process.env.ANON_COOKIE_SECRET
    if (!secret) {
      return Response.json({ error: 'server-config' }, { status: 500 })
    }

    const cookieHeader = req.headers.get('cookie')
    const { anonId, signed, fresh } = ensureAnonId(cookieHeader, secret)

    const url = new URL(req.url || '', 'http://localhost')
    const refType = url.searchParams.get('refType') || undefined

    const where: any = {
      and: [
        { anonId: { equals: anonId } },
        { kind: { equals: 'bookmark' } },
      ],
    }
    if (refType) where.and.push({ refType: { equals: refType } })

    const interactions = await req.payload.find({
      collection: 'interactions' as any,
      where,
      limit: 100,
      sort: '-createdAt',
    })

    const items = await Promise.all(
      interactions.docs.map(async (i: any) => {
        const collection = (i.refType === 'post' ? 'posts' : 'exams') as any
        const doc = await req.payload
          .findByID({ collection, id: i.refId, depth: 0 })
          .catch(() => null)
        return doc ? { refType: i.refType, refId: i.refId, doc } : null
      }),
    )

    const response = Response.json({ items: items.filter(Boolean) })
    if (fresh) {
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : ''
      response.headers.append(
        'Set-Cookie',
        `anon_id=${encodeURIComponent(signed)}; ${COOKIE_OPTS}${secureFlag}`,
      )
    }
    return response
  },
}
