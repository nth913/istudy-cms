import type { CollectionSlug, Endpoint, PayloadRequest } from 'payload'

const POSTS_COLLECTION = 'posts' as CollectionSlug

export const postsFeaturedEndpoint: Endpoint = {
  path: '/featured',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const url = new URL(req.url || '', 'http://localhost')
    const limitParam = Number(url.searchParams.get('limit') || '6')
    const limit = Math.min(
      12,
      Math.max(1, Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 6),
    )

    const result = await req.payload.find({
      collection: POSTS_COLLECTION,
      where: {
        and: [
          { _status: { equals: 'published' } },
          { isFeatured: { equals: true } },
        ],
      },
      limit,
      sort: '-publishedAt',
      depth: 1,
    })

    return Response.json(result)
  },
}
