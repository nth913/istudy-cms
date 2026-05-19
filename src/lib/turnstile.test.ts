import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { verifyTurnstileToken } from './turnstile'

const ORIGINAL_ENV = process.env.TURNSTILE_SECRET

function mockFetchOk(body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

describe('verifyTurnstileToken', () => {
  beforeEach(() => {
    process.env.TURNSTILE_SECRET = 'test-secret'
    vi.restoreAllMocks()
  })

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env.TURNSTILE_SECRET
    else process.env.TURNSTILE_SECRET = ORIGINAL_ENV
    vi.restoreAllMocks()
  })

  it('returns true when Cloudflare responds with success=true', async () => {
    mockFetchOk({ success: true })
    await expect(verifyTurnstileToken('token-ok', '1.2.3.4')).resolves.toBe(true)
  })

  it('returns false when Cloudflare responds with success=false', async () => {
    mockFetchOk({ success: false, 'error-codes': ['invalid-input-response'] })
    await expect(verifyTurnstileToken('token-bad')).resolves.toBe(false)
  })

  it('returns false when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))
    await expect(verifyTurnstileToken('token-any')).resolves.toBe(false)
  })

  it('returns true (skip) in dev when TURNSTILE_SECRET is missing', async () => {
    delete process.env.TURNSTILE_SECRET
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(verifyTurnstileToken('any-token')).resolves.toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns false when token is an empty string', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(verifyTurnstileToken('')).resolves.toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
