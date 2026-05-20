import type { Endpoint, PayloadRequest } from 'payload'

export const eventPublishDeEndpoint: Endpoint = {
  path: '/:id/publish-de',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = req.routeParams?.id as string
    if (!id) {
      return Response.json({ error: 'Missing event id' }, { status: 400 })
    }

    try {
      const existing = await req.payload.findByID({
        collection: 'events',
        id,
      })
      if (!existing) {
        return Response.json({ error: 'Event không tồn tại' }, { status: 404 })
      }
    } catch {
      return Response.json({ error: 'Event không tồn tại' }, { status: 404 })
    }

    const updated = await req.payload.update({
      collection: 'events',
      id,
      data: { deReady: true },
    })

    return Response.json({ data: updated })
  },
}
