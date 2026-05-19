import type { Endpoint, PayloadRequest, Where } from 'payload'

export const eventsActiveEndpoint: Endpoint = {
  path: '/active',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const url = new URL(req.url || '', 'http://localhost')
    const surface = url.searchParams.get('surface') ?? undefined

    const now = new Date().toISOString()
    const and: Where[] = [
      { _status: { equals: 'published' } },
      { startAt: { less_than_equal: now } },
      { endAt: { greater_than: now } },
    ]
    if (surface) {
      and.push({ surfaces: { contains: surface } })
    }

    const result = await req.payload.find({
      collection: 'events',
      where: { and },
      sort: 'startAt',
      limit: 20,
      depth: 1,
    })

    return Response.json(result)
  },
}
