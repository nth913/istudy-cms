import type { CollectionSlug, Endpoint, PayloadRequest } from 'payload'

const BOOKS = 'books' as CollectionSlug

export const booksDetailEndpoint: Endpoint = {
  path: '/by-slug/:slug',
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
      depth: 2,
    })

    const book = result.docs[0]
    if (!book) {
      return Response.json({ error: 'Không tìm thấy sách' }, { status: 404 })
    }

    return Response.json(book)
  },
}
