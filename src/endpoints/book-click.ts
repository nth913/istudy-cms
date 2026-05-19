import type { CollectionSlug, Endpoint, PayloadRequest } from 'payload'
import { parseSignedCookie } from '../lib/anon-cookie'

const BOOKS = 'books' as CollectionSlug
const CLICKS = 'affiliate_clicks' as CollectionSlug

const SAMPLE_RATE = 0.1

type BookDoc = {
  id: string | number
  externalUrl?: string
  partner?: string
  clickCount?: number
  _status?: string
}

export const bookClickEndpoint: Endpoint = {
  path: '/by-slug/:slug/click',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const slug = req.routeParams?.slug as string | undefined
    if (!slug) {
      return Response.json({ error: 'Slug bắt buộc' }, { status: 400 })
    }

    const result = await req.payload.find({
      collection: BOOKS,
      where: {
        and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }],
      },
      limit: 1,
      depth: 0,
    })

    const book = result.docs[0] as unknown as BookDoc | undefined
    if (!book || !book.externalUrl) {
      return Response.json({ error: 'Không tìm thấy sách' }, { status: 404 })
    }

    if (Math.random() < SAMPLE_RATE) {
      const cookieHeader = req.headers.get('cookie')
      const anonId = parseSignedCookie(cookieHeader, 'anon_id') ?? undefined
      const referer = req.headers.get('referer') ?? undefined
      const ua = req.headers.get('user-agent') ?? undefined

      void req.payload
        .create({
          collection: CLICKS,
          data: {
            book: book.id,
            anonId,
            referer,
            ua,
            partner: book.partner,
          } as Record<string, unknown>,
          overrideAccess: true,
        })
        .catch((err: unknown) => console.error('[book-click] insert failed', err))

      const nextCount = (typeof book.clickCount === 'number' ? book.clickCount : 0) + 1
      void req.payload
        .update({
          collection: BOOKS,
          id: book.id,
          data: { clickCount: nextCount } as Record<string, unknown>,
          depth: 0,
          overrideAccess: true,
        })
        .catch((err: unknown) => console.error('[book-click] clickCount denorm failed', err))
    }

    return Response.redirect(book.externalUrl, 302)
  },
}
