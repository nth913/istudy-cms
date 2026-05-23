import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { examsAfterChange } from './examsAfterChange'

// Mute Slack network call: notifySlack only fires when SLACK_WEBHOOK_URL set,
// but we still spy on global.fetch to inspect revalidate webhook calls.
describe('examsAfterChange — revalidate webhook', () => {
  const originalUrl = process.env.FE_URL
  const originalSecret = process.env.REVALIDATE_SECRET
  const originalSlack = process.env.SLACK_WEBHOOK_URL

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.FE_URL = 'http://web.test'
    process.env.REVALIDATE_SECRET = 'test-secret'
    delete process.env.SLACK_WEBHOOK_URL
  })

  afterEach(() => {
    process.env.FE_URL = originalUrl
    process.env.REVALIDATE_SECRET = originalSecret
    if (originalSlack === undefined) delete process.env.SLACK_WEBHOOK_URL
    else process.env.SLACK_WEBHOOK_URL = originalSlack
  })

  it('fire POST webhook with combined tags+paths body on update', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    await examsAfterChange({
      doc: { _status: 'published', slug: 'a', title: 'A' },
      previousDoc: { _status: 'published' },
      operation: 'update',
    } as any)
    await new Promise((r) => setTimeout(r, 10))
    expect(fetchMock).toHaveBeenCalled()
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('http://web.test/api/revalidate')
    expect((init as any)?.headers?.['x-secret']).toBe('test-secret')
    expect((init as any)?.method).toBe('POST')
    const body = JSON.parse(String((init as any)?.body))
    expect(body.tags).toContain('mega-menu-kho-de')
    expect(body.tags).toContain('exams-list')
    expect(body.tags).toContain('exams-sidebar-facets')
    expect(body.tags).toContain('exam:a')
    expect(body.paths).toContain('/kho-de-thi')
    expect(body.paths).toContain('/de-thi-chi-tiet/a')
  })

  it('omit slug-scoped tag + path when slug missing', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    await examsAfterChange({
      doc: { _status: 'published', title: 'no-slug' },
      previousDoc: { _status: 'published' },
      operation: 'update',
    } as any)
    await new Promise((r) => setTimeout(r, 10))
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(String((init as any)?.body))
    expect(body.tags).toContain('mega-menu-kho-de')
    expect(body.tags.find((t: string) => t.startsWith('exam:'))).toBeUndefined()
    expect(body.paths).toEqual(['/kho-de-thi'])
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
    delete process.env.FE_URL
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

describe('examsAfterChange — deReady transition Slack', () => {
  const originalUrl = process.env.FE_URL
  const originalSecret = process.env.REVALIDATE_SECRET
  const originalSlack = process.env.SLACK_WEBHOOK_URL

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.FE_URL = 'http://web.test'
    process.env.SLACK_WEBHOOK_URL = 'http://slack.test'
    process.env.REVALIDATE_SECRET = 'test-secret'
  })

  afterEach(() => {
    process.env.FE_URL = originalUrl
    process.env.REVALIDATE_SECRET = originalSecret
    if (originalSlack === undefined) delete process.env.SLACK_WEBHOOK_URL
    else process.env.SLACK_WEBHOOK_URL = originalSlack
  })

  it('Slack notify when previousDoc.deReady=false → doc.deReady=true', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    await examsAfterChange({
      doc: { _status: 'published', slug: 'x', title: 'X exam', deReady: true },
      previousDoc: { _status: 'published', deReady: false },
      operation: 'update',
    } as any)
    await new Promise((r) => setTimeout(r, 10))
    const slackCalls = fetchMock.mock.calls.filter((c) => String(c[0]).includes('slack.test'))
    expect(slackCalls.length).toBeGreaterThan(0)
    const body = JSON.parse(String((slackCalls[0][1] as any).body))
    expect(String(body.text)).toContain('đã có file')
    expect(String(body.text)).toContain('X exam')
  })

  it('no Slack notify when deReady stays true', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    await examsAfterChange({
      doc: { _status: 'published', slug: 'x', title: 'X', deReady: true },
      previousDoc: { _status: 'published', deReady: true },
      operation: 'update',
    } as any)
    await new Promise((r) => setTimeout(r, 10))
    const slackCalls = fetchMock.mock.calls.filter((c) => String(c[0]).includes('slack.test'))
    expect(slackCalls.length).toBe(0)
  })
})
