// istudy-cms/src/lib/thumbnail-pick.test.ts
import { describe, it, expect } from 'vitest'
import { fnv1a, pickPresetIndex } from './thumbnail-pick'

describe('fnv1a', () => {
  it('is deterministic for the same input', () => {
    expect(fnv1a('de-thi-2026-nghe-an')).toBe(fnv1a('de-thi-2026-nghe-an'))
  })
  it('differs for different inputs', () => {
    expect(fnv1a('a')).not.toBe(fnv1a('b'))
  })
  it('returns a non-negative 32-bit integer', () => {
    const h = fnv1a('any-slug')
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThanOrEqual(0xffffffff)
  })
})

describe('pickPresetIndex', () => {
  it('is stable for the same slug + pool length', () => {
    expect(pickPresetIndex('toeic-1', 13)).toBe(pickPresetIndex('toeic-1', 13))
  })
  it('always returns an in-range index', () => {
    for (let i = 0; i < 200; i++) {
      const idx = pickPresetIndex(`slug-${i}`, 13)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(13)
    }
  })
  it('returns 0 when pool length is 0 (caller guards, but no NaN)', () => {
    expect(pickPresetIndex('x', 0)).toBe(0)
  })
  it('spreads across the pool (not all one bucket)', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 100; i++) seen.add(pickPresetIndex(`exam-${i}-2026`, 13))
    expect(seen.size).toBeGreaterThan(5)
  })
})
