// istudy-cms/src/hooks/computeSearchKeyEvent.test.ts
import { describe, expect, it } from 'vitest'
import { computeSearchKeyEvent } from './computeSearchKeyEvent'

describe('computeSearchKeyEvent', () => {
  it('combines title + short + heroEyebrow stripped lowercase', () => {
    const data = { title: 'HSA Đợt 1 — 2026', short: 'HSA 26', heroEyebrow: 'Mùa thi 2026' }
    const result = computeSearchKeyEvent({ data } as any)
    expect(result.searchKeyEvent).toBe('hsa dot 1 — 2026 hsa 26 mua thi 2026')
  })
  it('handles missing fields', () => {
    expect(computeSearchKeyEvent({ data: { title: 'X' } } as any).searchKeyEvent).toBe('x')
    expect(computeSearchKeyEvent({ data: {} } as any).searchKeyEvent).toBe('')
  })
})
