// istudy-cms/src/hooks/assignExamThumbnail.test.ts
import { describe, it, expect, vi } from 'vitest'
import { assignExamThumbnail } from './assignExamThumbnail'

function fakeReq(poolIds: string[]) {
  return {
    payload: {
      find: vi.fn(async () => ({
        docs: poolIds.map((id) => ({ id })),
      })),
    },
    context: {},
  } as any
}

describe('assignExamThumbnail', () => {
  it('assigns a deterministic preset + sets thumbnailAuto when thumbnail empty', async () => {
    const req = fakeReq(['m1', 'm2', 'm3'])
    const data: any = { slug: 'toeic-1' }
    const out = await assignExamThumbnail({ data, req, context: req.context } as any)
    expect(['m1', 'm2', 'm3']).toContain(out.thumbnail)
    expect(out.thumbnailAuto).toBe(true)
    // deterministic: same slug → same preset
    const out2 = await assignExamThumbnail({ data: { slug: 'toeic-1' }, req, context: req.context } as any)
    expect(out2.thumbnail).toBe(out.thumbnail)
  })

  it('leaves a user-provided thumbnail and marks thumbnailAuto false', async () => {
    const req = fakeReq(['m1', 'm2'])
    const data: any = { slug: 'x', thumbnail: 'user-media-id' }
    const out = await assignExamThumbnail({ data, req, context: req.context } as any)
    expect(out.thumbnail).toBe('user-media-id')
    expect(out.thumbnailAuto).toBe(false)
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it('no-ops without throwing when the preset pool is empty', async () => {
    const req = fakeReq([])
    const data: any = { slug: 'x' }
    const out = await assignExamThumbnail({ data, req, context: req.context } as any)
    expect(out.thumbnail).toBeUndefined()
  })

  it('skips entirely when context.skipThumbnailHook is set', async () => {
    const req = fakeReq(['m1'])
    const data: any = { slug: 'x', thumbnail: 'preset-1', thumbnailAuto: true }
    const out = await assignExamThumbnail({ data, req, context: { skipThumbnailHook: true } } as any)
    expect(out.thumbnailAuto).toBe(true)
    expect(req.payload.find).not.toHaveBeenCalled()
  })
})
