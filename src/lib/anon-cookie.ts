import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME_DEFAULT = 'anon_id'

export function generateAnonId(): string {
  return randomBytes(16).toString('hex')
}

function hmacHex(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

export function signAnonId(id: string, secret: string): string {
  return `${id}.${hmacHex(id, secret)}`
}

export function verifyAnonId(signed: string, secret: string): string | null {
  if (!signed) return null
  const lastDot = signed.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === signed.length - 1) return null
  const id = signed.slice(0, lastDot)
  const sig = signed.slice(lastDot + 1)
  const expected = hmacHex(id, secret)
  if (sig.length !== expected.length) return null
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || a.length === 0) return null
    return timingSafeEqual(a, b) ? id : null
  } catch {
    return null
  }
}

export function parseSignedCookie(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const key = part.slice(0, eq).trim()
    if (key !== name) continue
    const raw = part.slice(eq + 1).trim()
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}

export interface AnonIdResult {
  anonId: string
  signed: string
  fresh: boolean
}

export function ensureAnonId(
  cookieHeader: string | null | undefined,
  secret: string,
): AnonIdResult {
  const existing = parseSignedCookie(cookieHeader, COOKIE_NAME_DEFAULT)
  if (existing) {
    const verified = verifyAnonId(existing, secret)
    if (verified) {
      return { anonId: verified, signed: existing, fresh: false }
    }
  }
  const anonId = generateAnonId()
  const signed = signAnonId(anonId, secret)
  return { anonId, signed, fresh: true }
}
