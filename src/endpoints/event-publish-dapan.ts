import type { Endpoint, PayloadRequest } from 'payload'

export const eventPublishDapAnEndpoint: Endpoint = {
  path: '/:id/publish-dapan',
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
      await req.payload.findByID({ collection: 'events', id })
    } catch {
      return Response.json({ error: 'Event không tồn tại' }, { status: 404 })
    }

    // Auto-tick deReady when publishing đáp án (Q2 of spec)
    const updated = await req.payload.update({
      collection: 'events',
      id,
      data: { dapAnReady: true, deReady: true },
    })

    return Response.json({ data: updated })
  },
}
