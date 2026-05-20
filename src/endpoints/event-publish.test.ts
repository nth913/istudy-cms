import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventPublishDeEndpoint } from './event-publish-de'
import { eventPublishDapAnEndpoint } from './event-publish-dapan'

const makeReq = (overrides: any = {}) => ({
  user: { role: 'admin' },
  routeParams: { id: 'e1' },
  payload: {
    findByID: vi.fn().mockResolvedValue({ id: 'e1', _status: 'published' }),
    update: vi.fn().mockResolvedValue({ id: 'e1', deReady: true, _status: 'published' }),
  },
  ...overrides,
})

describe('eventPublishDeEndpoint', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates deReady=true on success', async () => {
    const req = makeReq()
    const res = (await eventPublishDeEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(200)
    expect(req.payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'events',
        id: 'e1',
        data: { deReady: true },
      }),
    )
  })

  it('returns 404 when event not found', async () => {
    const req = makeReq({
      payload: {
        findByID: vi.fn().mockRejectedValue(new Error('not found')),
        update: vi.fn(),
      },
    })
    const res = (await eventPublishDeEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(404)
    expect(req.payload.update).not.toHaveBeenCalled()
  })

  it('returns 403 when user role is viewer', async () => {
    const req = makeReq({ user: { role: 'viewer' } })
    const res = (await eventPublishDeEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(403)
  })

  it('returns 403 when no user (unauthenticated)', async () => {
    const req = makeReq({ user: null })
    const res = (await eventPublishDeEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(403)
  })
})

describe('eventPublishDapAnEndpoint', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates dapAnReady=true AND auto-ticks deReady', async () => {
    const req = makeReq({
      payload: {
        findByID: vi.fn().mockResolvedValue({ id: 'e1' }),
        update: vi.fn().mockResolvedValue({ id: 'e1', dapAnReady: true, deReady: true }),
      },
    })
    const res = (await eventPublishDapAnEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(200)
    expect(req.payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { dapAnReady: true, deReady: true },
      }),
    )
  })

  it('returns 403 for non-editor user', async () => {
    const req = makeReq({ user: { role: 'reviewer' } })
    const res = (await eventPublishDapAnEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(403)
  })

  it('allows editor role', async () => {
    const req = makeReq({ user: { role: 'editor' } })
    const res = (await eventPublishDapAnEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(200)
  })
})
