const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

let devSkipWarned = false

interface SiteverifyResponse {
  success?: boolean
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET
  if (!secret) {
    if (!devSkipWarned) {
      console.warn('[turnstile] TURNSTILE_SECRET not set — skipping verification (dev mode)')
      devSkipWarned = true
    }
    return true
  }
  if (!token) return false

  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  try {
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body })
    const data = (await res.json()) as SiteverifyResponse
    return data.success === true
  } catch {
    return false
  }
}
