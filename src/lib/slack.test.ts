import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { notifySlack } from './slack'

describe('notifySlack', () => {
  const originalFetch = global.fetch
  beforeEach(() => { global.fetch = vi.fn().mockResolvedValue({ ok: true }) as any })
  afterEach(() => { global.fetch = originalFetch })

  it('no-op when SLACK_WEBHOOK_URL unset', async () => {
    const prev = process.env.SLACK_WEBHOOK_URL
    delete process.env.SLACK_WEBHOOK_URL
    await notifySlack('hello')
    expect(global.fetch).not.toHaveBeenCalled()
    if (prev) process.env.SLACK_WEBHOOK_URL = prev
  })

  it('POSTs text payload when SLACK_WEBHOOK_URL set', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
    await notifySlack('hello world')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'hello world' }),
      }),
    )
    delete process.env.SLACK_WEBHOOK_URL
  })

  it('swallows fetch errors', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
    global.fetch = vi.fn().mockRejectedValue(new Error('boom')) as any
    await expect(notifySlack('x')).resolves.toBeUndefined()
    delete process.env.SLACK_WEBHOOK_URL
  })
})
