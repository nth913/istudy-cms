// src/hooks/recomputeTagsForDoc.test.ts
import { describe, it, expect, vi } from 'vitest'
import { recomputeTagsAfterChange, recomputeTagsAfterDelete } from './recomputeTagsForDoc'

const mkPayload = () => ({ find: vi.fn(async () => ({ docs: [] })), update: vi.fn(async () => ({})) })

describe('recomputeTagsAfterChange', () => {
  it('recomputes union of previous + new topic ids', async () => {
    const payload = mkPayload()
    await recomputeTagsAfterChange({
      doc: { topics: ['a', 'b'] }, previousDoc: { topics: ['b', 'c'] }, req: { payload },
    } as any)
    // 3 distinct tags → 3 exams find + 3 posts find = 6 find calls
    expect(payload.find).toHaveBeenCalledTimes(6)
    expect(payload.update).toHaveBeenCalledTimes(3)
  })
  it('no topics → no work', async () => {
    const payload = mkPayload()
    await recomputeTagsAfterChange({ doc: {}, previousDoc: {}, req: { payload } } as any)
    expect(payload.update).not.toHaveBeenCalled()
  })
})

describe('recomputeTagsAfterDelete', () => {
  it('recomputes the deleted doc topics', async () => {
    const payload = mkPayload()
    await recomputeTagsAfterDelete({ doc: { topics: [{ id: 'x' }] }, req: { payload } } as any)
    expect(payload.update).toHaveBeenCalledTimes(1)
  })
})
