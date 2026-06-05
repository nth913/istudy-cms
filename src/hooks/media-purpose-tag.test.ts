import { describe, it, expect, vi } from 'vitest'
import { addPurposeTag, makeMediaPurposeTagger } from './media-purpose-tag'

describe('addPurposeTag', () => {
  it('appends purpose when not present', async () => {
    const payload = {
      findByID: vi.fn(async () => ({ purposes: ['other'] })),
      update: vi.fn(async () => ({})),
    } as any
    await addPurposeTag(payload, 'media-1', 'exam_thumbnail')
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'media',
      id: 'media-1',
      data: { purposes: ['other', 'exam_thumbnail'] },
    })
  })

  it('skips update when purpose already present', async () => {
    const payload = {
      findByID: vi.fn(async () => ({ purposes: ['exam_thumbnail', 'other'] })),
      update: vi.fn(),
    } as any
    await addPurposeTag(payload, 'media-1', 'exam_thumbnail')
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('handles null purposes field', async () => {
    const payload = {
      findByID: vi.fn(async () => ({ purposes: null })),
      update: vi.fn(async () => ({})),
    } as any
    await addPurposeTag(payload, 'media-1', 'post_cover')
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'media',
      id: 'media-1',
      data: { purposes: ['post_cover'] },
    })
  })
})

describe('makeMediaPurposeTagger', () => {
  it('calls addPurposeTag when field changes', async () => {
    const payload = {
      findByID: vi.fn(async () => ({ purposes: [] })),
      update: vi.fn(async () => ({})),
    } as any
    const hook = makeMediaPurposeTagger('thumbnail', 'exam_thumbnail')
    await hook({ doc: { thumbnail: 'media-1' }, previousDoc: { thumbnail: null }, req: { payload } } as any)
    await new Promise(r => setTimeout(r, 10))
    expect(payload.update).toHaveBeenCalled()
  })

  it('no-op when field unchanged', async () => {
    const payload = { findByID: vi.fn(), update: vi.fn() } as any
    const hook = makeMediaPurposeTagger('thumbnail', 'exam_thumbnail')
    await hook({ doc: { thumbnail: 'media-1' }, previousDoc: { thumbnail: 'media-1' }, req: { payload } } as any)
    await new Promise(r => setTimeout(r, 10))
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('extracts id from populated relation object', async () => {
    const payload = {
      findByID: vi.fn(async () => ({ purposes: [] })),
      update: vi.fn(async () => ({})),
    } as any
    const hook = makeMediaPurposeTagger('cover', 'post_cover')
    await hook({ doc: { cover: { id: 'media-2', url: '/img' } }, previousDoc: { cover: null }, req: { payload } } as any)
    await new Promise(r => setTimeout(r, 10))
    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'media', id: 'media-2' })
  })

  it('no-op when field is null', async () => {
    const payload = { findByID: vi.fn(), update: vi.fn() } as any
    const hook = makeMediaPurposeTagger('cover', 'post_cover')
    await hook({ doc: { cover: null }, previousDoc: { cover: 'media-1' }, req: { payload } } as any)
    await new Promise(r => setTimeout(r, 10))
    expect(payload.update).not.toHaveBeenCalled()
  })
})
