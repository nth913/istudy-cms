import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LRUCache } from 'lru-cache'
import { viewDedupCache } from './lru'

describe('viewDedupCache', () => {
  beforeEach(() => {
    viewDedupCache.clear()
  })

  afterEach(() => {
    viewDedupCache.clear()
  })

  it('set then has returns true for the same key', () => {
    viewDedupCache.set('k', true)
    expect(viewDedupCache.has('k')).toBe(true)
  })

  it('evicts oldest entry when max capacity exceeded', () => {
    const max = viewDedupCache.max
    for (let i = 0; i < max + 1; i++) {
      viewDedupCache.set(`key-${i}`, true)
    }
    expect(viewDedupCache.has('key-0')).toBe(false)
    expect(viewDedupCache.has(`key-${max}`)).toBe(true)
  })

  it('isolates keys by prefix', () => {
    viewDedupCache.set('aid-A:exam:x', true)
    expect(viewDedupCache.has('aid-A:exam:x')).toBe(true)
    expect(viewDedupCache.has('aid-B:exam:x')).toBe(false)
  })

  it('has spec-aligned config (ttl=30min, max=100K, no age-update)', () => {
    expect(viewDedupCache.ttl).toBe(30 * 60 * 1000)
    expect(viewDedupCache.max).toBe(100_000)
    expect(viewDedupCache.updateAgeOnGet).toBe(false)
  })

  it('expires entry after TTL on real timer (small isolated cache)', async () => {
    const cache = new LRUCache<string, true>({
      max: 10,
      ttl: 50,
      updateAgeOnGet: false,
    })
    cache.set('k', true)
    expect(cache.has('k')).toBe(true)
    await new Promise((r) => setTimeout(r, 80))
    expect(cache.has('k')).toBe(false)
  })
})
