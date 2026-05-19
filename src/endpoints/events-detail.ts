import type { Endpoint, PayloadRequest } from 'payload'

export const eventsDetailEndpoint: Endpoint = {
  path: '/by-slug/:slug',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const slug = req.routeParams?.slug as string | undefined
    if (!slug) {
      return Response.json({ error: 'Thiếu slug' }, { status: 400 })
    }

    const result = await req.payload.find({
      collection: 'events',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { slug: { equals: slug } },
        ],
      },
      limit: 1,
      depth: 2,
    })

    const ev = result.docs[0]
    if (!ev) {
      return Response.json({ error: 'Không tìm thấy sự kiện' }, { status: 404 })
    }

    return Response.json(ev)
  },
}
