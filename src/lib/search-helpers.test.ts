// istudy-cms/src/lib/search-helpers.test.ts
import { describe, expect, it } from 'vitest'
import { formatVN, minutesRead, extractRichText } from './search-helpers'

describe('formatVN', () => {
  it('formats ISO date to DD/MM', () => {
    expect(formatVN('2026-06-27T08:00:00.000Z')).toBe('27/06')
  })
  it('returns empty string on null/undefined/invalid', () => {
    expect(formatVN(null)).toBe('')
    expect(formatVN(undefined)).toBe('')
    expect(formatVN('invalid')).toBe('')
  })
})

describe('extractRichText', () => {
  it('extracts plain text from lexical-style nodes', () => {
    const node = { root: { children: [{ children: [{ text: 'Hello ' }, { text: 'world' }] }] } }
    expect(extractRichText(node)).toBe('Hello world')
  })
  it('returns empty string on null/empty', () => {
    expect(extractRichText(null)).toBe('')
    expect(extractRichText(undefined)).toBe('')
    expect(extractRichText({})).toBe('')
  })
})

describe('minutesRead', () => {
  it('returns ceil(chars/1000) min 1', () => {
    const short = { root: { children: [{ children: [{ text: 'a'.repeat(500) }] }] } }
    expect(minutesRead(short)).toBe(1)
    const long = { root: { children: [{ children: [{ text: 'a'.repeat(2400) }] }] } }
    expect(minutesRead(long)).toBe(3)
  })
  it('returns 1 on empty', () => {
    expect(minutesRead(null)).toBe(1)
  })
})
