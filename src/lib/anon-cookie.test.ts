import { describe, it, expect } from 'vitest'
import {
  generateAnonId,
  signAnonId,
  verifyAnonId,
  parseSignedCookie,
  ensureAnonId,
} from './anon-cookie'

const SECRET = 'a'.repeat(32)

describe('generateAnonId', () => {
  it('returns 32-char hex string', () => {
    const id = generateAnonId()
    expect(id).toMatch(/^[0-9a-f]{32}$/)
  })

  it('returns unique values across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateAnonId()))
    expect(ids.size).toBe(100)
  })
})

describe('signAnonId + verifyAnonId', () => {
  it('round-trips: signed value verifies back to original id', () => {
    const id = generateAnonId()
    const signed = signAnonId(id, SECRET)
    expect(verifyAnonId(signed, SECRET)).toBe(id)
  })

  it('returns null when signature is tampered', () => {
    const id = generateAnonId()
    const signed = signAnonId(id, SECRET)
    const [head, sig] = signed.split('.')
    const tampered = `${head}.${sig.slice(0, -2)}ff`
    expect(verifyAnonId(tampered, SECRET)).toBeNull()
  })

  it('returns null when verifying with the wrong secret', () => {
    const id = generateAnonId()
    const signed = signAnonId(id, SECRET)
    expect(verifyAnonId(signed, 'b'.repeat(32))).toBeNull()
  })

  it('returns null when the signed string is malformed', () => {
    expect(verifyAnonId('no-dot-here', SECRET)).toBeNull()
    expect(verifyAnonId('', SECRET)).toBeNull()
  })
})

describe('parseSignedCookie', () => {
  it('extracts named value from a multi-cookie header', () => {
    const header = 'foo=bar; anon_id=abc123.signature; other=baz'
    expect(parseSignedCookie(header, 'anon_id')).toBe('abc123.signature')
  })

  it('returns null when cookie is absent', () => {
    expect(parseSignedCookie('foo=bar; baz=qux', 'anon_id')).toBeNull()
    expect(parseSignedCookie(null, 'anon_id')).toBeNull()
    expect(parseSignedCookie(undefined, 'anon_id')).toBeNull()
    expect(parseSignedCookie('', 'anon_id')).toBeNull()
  })

  it('decodes URL-encoded values', () => {
    const header = 'anon_id=abc%2E123'
    expect(parseSignedCookie(header, 'anon_id')).toBe('abc.123')
  })
})

describe('ensureAnonId', () => {
  it('returns existing id when cookie carries a valid signed value', () => {
    const id = generateAnonId()
    const signed = signAnonId(id, SECRET)
    const header = `anon_id=${encodeURIComponent(signed)}`
    const result = ensureAnonId(header, SECRET)
    expect(result.anonId).toBe(id)
    expect(result.signed).toBe(signed)
    expect(result.fresh).toBe(false)
  })

  it('generates a new id when no cookie is present', () => {
    const result = ensureAnonId(null, SECRET)
    expect(result.anonId).toMatch(/^[0-9a-f]{32}$/)
    expect(result.signed.startsWith(`${result.anonId}.`)).toBe(true)
    expect(result.fresh).toBe(true)
    expect(verifyAnonId(result.signed, SECRET)).toBe(result.anonId)
  })

  it('generates a new id when the existing cookie has a bad signature', () => {
    const header = 'anon_id=deadbeef.notasignature'
    const result = ensureAnonId(header, SECRET)
    expect(result.fresh).toBe(true)
    expect(result.anonId).not.toBe('deadbeef')
  })
})
