// src/endpoints/search-meta-helpers.test.ts
import { describe, it, expect, vi } from 'vitest'
import { computePopularTags, computeTopProvinces } from './search-meta-helpers'

describe('computePopularTags', () => {
  it('maps tag docs → {id,label,slug,hot}, limited', async () => {
    const payload = { find: vi.fn(async () => ({ docs: [
      { id: '1', name: 'Word formation', slug: 'word-formation', hot: false },
      { id: '2', name: 'Đề minh hoạ', slug: 'de-minh-hoa', hot: true },
    ] })) }
    const out = await computePopularTags(payload as any, 3)
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'tags', sort: '-popularScore', limit: 3,
      where: { usageCount: { greater_than: 0 } },
    }))
    expect(out).toEqual([
      { id: '1', label: 'Word formation', slug: 'word-formation', hot: false },
      { id: '2', label: 'Đề minh hoạ', slug: 'de-minh-hoa', hot: true },
    ])
  })
})

describe('computeTopProvinces', () => {
  it('ranks provinces by vao-10 exam count + views weight, returns names', async () => {
    const payload = {
      find: vi.fn(async ({ collection }: any) => {
        if (collection === 'exams') return { docs: [
          { province: 'pA', views: 10 }, { province: 'pA', views: 5 },
          { province: 'pB', views: 1000 },
        ] }
        if (collection === 'provinces') return { docs: [
          { id: 'pA', name: 'Hà Nội' }, { id: 'pB', name: 'Đà Nẵng' },
        ] }
        return { docs: [] }
      }),
    }
    const out = await computeTopProvinces(payload as any, 2)
    // pA: 2 + 15*0.001=2.015 ; pB: 1 + 1000*0.001=2.0 → pA first
    expect(out).toEqual(['Hà Nội', 'Đà Nẵng'])
  })
})
