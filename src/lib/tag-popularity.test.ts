// src/lib/tag-popularity.test.ts
import { describe, it, expect, vi } from 'vitest'
import { computePopularScore, extractTagIds, recomputeTags, WEIGHT_VIEWS } from './tag-popularity'

describe('computePopularScore', () => {
  it('adds usageCount + weighted views', () => {
    expect(computePopularScore(3, 1000)).toBeCloseTo(3 + 1000 * WEIGHT_VIEWS)
  })
  it('views are a small booster, never outweigh count', () => {
    expect(computePopularScore(2, 0)).toBeGreaterThan(computePopularScore(1, 999))
  })
})

describe('extractTagIds', () => {
  it('handles id strings and populated objects', () => {
    expect(extractTagIds(['a', 'b'])).toEqual(['a', 'b'])
    expect(extractTagIds([{ id: 'a' }, { id: 'b' }])).toEqual(['a', 'b'])
    expect(extractTagIds(null)).toEqual([])
  })
})

describe('recomputeTags', () => {
  it('counts published exams+posts and sums views, then updates tag', async () => {
    const payload = {
      find: vi.fn(async ({ collection }: any) => {
        if (collection === 'exams') return { docs: [{ views: 100 }, { views: 50 }] }
        if (collection === 'posts') return { docs: [{ viewCount: 30 }] }
        return { docs: [] }
      }),
      update: vi.fn(async () => ({})),
    }
    await recomputeTags(payload as any, ['tag1'])
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'tags', id: 'tag1',
      data: { usageCount: 3, popularScore: computePopularScore(3, 180) },
    }))
  })

  it('zeroes a tag with no usage', async () => {
    const payload = {
      find: vi.fn(async () => ({ docs: [] })),
      update: vi.fn(async () => ({})),
    }
    await recomputeTags(payload as any, ['t'])
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ data: { usageCount: 0, popularScore: 0 } }))
  })
})
