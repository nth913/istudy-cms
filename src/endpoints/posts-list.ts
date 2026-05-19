import type { CollectionSlug, Endpoint, PayloadRequest, Where } from 'payload'

const POSTS_COLLECTION = 'posts' as CollectionSlug

const SELECT_FIELDS = {
  title: true,
  slug: true,
  excerpt: true,
  cover: true,
  category: true,
  tags: true,
  publishedAt: true,
  isFeatured: true,
  likeCount: true,
  viewCount: true,
} as const

export const postsListEndpoint: Endpoint = {
  path: '/list',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const url = new URL(req.url || '', 'http://localhost')
    const category = url.searchParams.get('category') || undefined
    const tag = url.searchParams.get('tag') || undefined
    const pageParam = Number(url.searchParams.get('page') || '1')
    const limitParam = Number(url.searchParams.get('limit') || '12')

    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1
    const limit = Math.min(
      50,
      Math.max(1, Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 12),
    )

    const where: Where = {
      _status: { equals: 'published' },
    }
    if (category) where.category = { equals: category }
    if (tag) where.tags = { contains: tag }

    const result = await req.payload.find({
      collection: POSTS_COLLECTION,
      where,
      page,
      limit,
      sort: '-publishedAt',
      depth: 1,
      select: SELECT_FIELDS,
    })

    return Response.json(result)
  },
}
