import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { examsAfterChange } from './examsAfterChange'

// Mute Slack network call: notifySlack only fires when SLACK_WEBHOOK_URL set,
// but we still spy on global.fetch to inspect revalidate webhook calls.
describe('examsAfterChange — revalidate webhook', () => {
  const originalUrl = process.env.WEB_REVALIDATE_URL
  const originalSecret = process.env.REVALIDATE_SECRET
  const originalSlack = process.env.SLACK_WEBHOOK_URL

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.WEB_REVALIDATE_URL = 'http://web.test/api/revalidate'
    process.env.REVALIDATE_SECRET = 'test-secret'
    delete process.env.SLACK_WEBHOOK_URL
  })

  afterEach(() => {
    process.env.WEB_REVALIDATE_URL = originalUrl
    process.env.REVALIDATE_SECRET = originalSecret
    if (originalSlack === undefined) delete process.env.SLACK_WEBHOOK_URL
    else process.env.SLACK_WEBHOOK_URL = originalSlack
  })

  it('fire POST webhook with secret header on update', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    await examsAfterChange({
      doc: { _status: 'published', slug: 'a', title: 'A' },
      previousDoc: { _status: 'published' },
      operation: 'update',
    } as any)
    // Wait microtask for void fire-and-forget to dispatch
    await new Promise((r) => setTimeout(r, 10))
    expect(fetchMock).toHaveBeenCalled()
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('tag=mega-menu-kho-de')
    expect((init as any)?.headers?.['x-secret']).toBe('test-secret')
    expect((init as any)?.method).toBe('POST')
  })

  it('fire webhook on draft → published transition (alongside Slack notify)', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    await examsAfterChange({
      doc: { _status: 'published', slug: 'a', title: 'A' },
      previousDoc: { _status: 'draft' },
      operation: 'update',
    } as any)
    await new Promise((r) => setTimeout(r, 10))
    // fetch may be called multiple times (Slack + webhook). Filter for revalidate.
    const revalidateCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes('revalidate'),
    )
    expect(revalidateCalls.length).toBeGreaterThan(0)
  })

  it('skip webhook when env missing', async () => {
    delete process.env.WEB_REVALIDATE_URL
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    await examsAfterChange({
      doc: { _status: 'published', slug: 'a', title: 'A' },
      previousDoc: { _status: 'published' },
      operation: 'update',
    } as any)
    await new Promise((r) => setTimeout(r, 10))
    const revalidateCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes('revalidate'),
    )
    expect(revalidateCalls.length).toBe(0)
  })

  it('not crash when fetch rejects', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network'))
    const result = await examsAfterChange({
      doc: { _status: 'published', slug: 'a', title: 'A' },
      previousDoc: { _status: 'published' },
      operation: 'update',
    } as any)
    expect(result).toMatchObject({ _status: 'published', slug: 'a', title: 'A' })
  })
})
