import { describe, it, expect } from 'vitest'
import { computeSearchKey } from './computeSearchKey'

describe('computeSearchKey', () => {
  it('computes a lowercase diacritic-free searchKey from title + school', () => {
    const data = { title: 'Đề Nghệ An', school: 'THCS Lê Lợi' } as any
    const result = computeSearchKey({ data, operation: 'create' } as any)
    expect(result?.searchKey).toBeDefined()
    expect(result?.searchKey).toBe(result?.searchKey?.toLowerCase())
    expect(result?.searchKey).toContain('nghe')
    expect(result?.searchKey).toContain('an')
  })

  it('does NOT touch searchKey on a partial update missing title and school', () => {
    const data = { thumbnail: 'media-x', thumbnailAuto: true } as any
    const result = computeSearchKey({
      data, operation: 'update', originalDoc: { searchKey: 'giu nguyen' },
    } as any)
    expect(result?.searchKey).toBeUndefined()
  })

  it('merges originalDoc.title when only school is in the change', () => {
    const data = { school: 'THPT A' } as any
    const result = computeSearchKey({
      data, operation: 'update', originalDoc: { title: 'Đề X' },
    } as any)
    expect(result?.searchKey).toContain('thpt a')
    expect(result?.searchKey).toContain('de x')
  })
})
