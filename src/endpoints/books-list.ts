import type { CollectionSlug, Endpoint, PayloadRequest, Where } from 'payload'

const BOOKS = 'books' as CollectionSlug

const SELECT_FIELDS = {
  title: true,
  slug: true,
  author: true,
  cover: true,
  shortDescription: true,
  partner: true,
  price: true,
  discountPrice: true,
  category: true,
  level: true,
  clickCount: true,
  updatedAt: true,
} as const

export const booksListEndpoint: Endpoint = {
  path: '/list',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const url = new URL(req.url || '', 'http://localhost')
    const category = url.searchParams.get('category') || undefined
    const level = url.searchParams.get('level') || undefined
    const pageParam = Number(url.searchParams.get('page') || '1')
    const limitParam = Number(url.searchParams.get('limit') || '12')

    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1
    const limit = Math.min(50, Math.max(1, Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 12))

    const where: Where = { _status: { equals: 'published' } }
    if (category) where.category = { equals: category }
    if (level) where.level = { equals: level }

    const result = await req.payload.find({
      collection: BOOKS,
      where,
      page,
      limit,
      sort: '-updatedAt',
      depth: 1,
      select: SELECT_FIELDS,
    })

    return Response.json(result)
  },
}
