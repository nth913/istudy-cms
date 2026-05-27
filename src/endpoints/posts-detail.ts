import type { CollectionSlug, Endpoint, PayloadRequest } from 'payload'

const POSTS_COLLECTION = 'posts' as CollectionSlug

type PostDoc = { id: string | number; [key: string]: unknown }

export const postsDetailEndpoint: Endpoint = {
  path: '/by-slug/:slug',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const slug = req.routeParams?.slug as string | undefined
    if (!slug) {
      return Response.json({ error: 'Slug bắt buộc' }, { status: 400 })
    }

    const result = await req.payload.find({
      collection: POSTS_COLLECTION,
      where: {
        and: [
          { _status: { equals: 'published' } },
          { slug: { equals: slug } },
        ],
      },
      limit: 1,
      depth: 2,
    })

    const post = result.docs[0] as unknown as PostDoc | undefined
    if (!post) {
      return Response.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
    }

    return Response.json(post)
  },
}
