import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventsAfterChange } from './eventsAfterChange'

const makeReq = (overrides: any = {}) => ({
  payload: { update: vi.fn().mockResolvedValue({}) },
  context: {},
  ...overrides,
})

describe('eventsAfterChange — autosave + draft skip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('early returns when context.autosave=true (no timestamp set)', async () => {
    const req = makeReq({ context: { autosave: true } })
    const doc = { id: '1', _status: 'published', deReady: true, slug: 'x' }
    const previousDoc = { id: '1', _status: 'published', deReady: false }
    await eventsAfterChange({ doc, previousDoc, req, operation: 'update' } as any)
    expect(req.payload.update).not.toHaveBeenCalled()
  })

  it('skips timestamp logic when _status=draft', async () => {
    const req = makeReq()
    const doc = { id: '1', _status: 'draft', deReady: true, slug: 'x' }
    const previousDoc = { id: '1', _status: 'draft', deReady: false }
    await eventsAfterChange({ doc, previousDoc, req, operation: 'update' } as any)
    expect(req.payload.update).not.toHaveBeenCalled()
  })
})

describe('eventsAfterChange — auto-set dePostedAt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets dePostedAt when deReady 0→1 on published doc', async () => {
    const req = makeReq()
    const doc = { id: '1', _status: 'published', deReady: true, dapAnReady: false, slug: 'x' }
    const previousDoc = { id: '1', _status: 'published', deReady: false, dapAnReady: false }
    await eventsAfterChange({ doc, previousDoc, req, operation: 'update' } as any)
    expect(req.payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'events',
        id: '1',
        data: expect.objectContaining({ dePostedAt: expect.any(String) }),
      }),
    )
  })

  it('does NOT set dePostedAt when deReady 1→1 (no change)', async () => {
    const req = makeReq()
    const doc = { id: '1', _status: 'published', deReady: true, slug: 'x' }
    const previousDoc = { id: '1', _status: 'published', deReady: true }
    await eventsAfterChange({ doc, previousDoc, req, operation: 'update' } as any)
    const deCall = req.payload.update.mock.calls.find((c: any) => c[0].data.dePostedAt)
    expect(deCall).toBeUndefined()
  })

  it('does NOT overwrite existing dePostedAt', async () => {
    const req = makeReq()
    const doc = {
      id: '1',
      _status: 'published',
      deReady: true,
      dePostedAt: '2026-01-01',
      slug: 'x',
    }
    const previousDoc = {
      id: '1',
      _status: 'published',
      deReady: false,
      dePostedAt: '2026-01-01',
    }
    await eventsAfterChange({ doc, previousDoc, req, operation: 'update' } as any)
    const deCall = req.payload.update.mock.calls.find((c: any) => c[0].data.dePostedAt)
    expect(deCall).toBeUndefined()
  })
})

describe('eventsAfterChange — auto-set dapAnPostedAt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets dapAnPostedAt when dapAnReady 0→1', async () => {
    const req = makeReq()
    const doc = { id: '1', _status: 'published', deReady: true, dapAnReady: true, slug: 'x' }
    const previousDoc = { id: '1', _status: 'published', deReady: true, dapAnReady: false }
    await eventsAfterChange({ doc, previousDoc, req, operation: 'update' } as any)
    expect(req.payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dapAnPostedAt: expect.any(String) }),
      }),
    )
  })

  it('sets both timestamps when both flags 0→1 same save', async () => {
    const req = makeReq()
    const doc = { id: '1', _status: 'published', deReady: true, dapAnReady: true, slug: 'x' }
    const previousDoc = { id: '1', _status: 'published', deReady: false, dapAnReady: false }
    await eventsAfterChange({ doc, previousDoc, req, operation: 'update' } as any)
    const deCall = req.payload.update.mock.calls.find((c: any) => c[0].data.dePostedAt)
    const dapAnCall = req.payload.update.mock.calls.find((c: any) => c[0].data.dapAnPostedAt)
    expect(deCall).toBeDefined()
    expect(dapAnCall).toBeDefined()
  })
})

describe('eventsAfterChange — dispatch log', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs event-de when deReady 0→1', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const req = makeReq()
    const doc = { id: '1', _status: 'published', deReady: true, slug: 'thpt-qg-2026' }
    const previousDoc = { id: '1', _status: 'published', deReady: false }
    await eventsAfterChange({ doc, previousDoc, req, operation: 'update' } as any)
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/kind=event-de.*eventId=1/))
    consoleSpy.mockRestore()
  })

  it('logs event-dapan when dapAnReady 0→1', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const req = makeReq()
    const doc = { id: '1', _status: 'published', deReady: true, dapAnReady: true, slug: 'x' }
    const previousDoc = { id: '1', _status: 'published', deReady: true, dapAnReady: false }
    await eventsAfterChange({ doc, previousDoc, req, operation: 'update' } as any)
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/kind=event-dapan/))
    consoleSpy.mockRestore()
  })
})
