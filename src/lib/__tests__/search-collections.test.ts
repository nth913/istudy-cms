import { describe, it, expect } from 'vitest'
import { CAT_SOURCES, buildCatWhere } from '../search-collections'

describe('buildCatWhere', () => {
  it('thpt → exams vao-dai-hoc, published, normalized q', () => {
    expect(buildCatWhere('thpt', { q: 'Đề Anh' })).toEqual({
      _status: { equals: 'published' },
      category: { equals: 'vao-dai-hoc' },
      searchKey: { contains: 'de anh' },
    })
  })
  it('l10 year + hasAnswer applied (exams)', () => {
    const w = buildCatWhere('l10', { year: '2025', hasAnswer: true })
    expect(w.category).toEqual({ equals: 'vao-10' })
    expect(w.year).toEqual({ equals: '2025' })
    expect(w.dapAnReady).toEqual({ equals: true })
  })
  it('hsa → events submenu, ignores year/hasAnswer, uses searchKeyEvent', () => {
    const w = buildCatWhere('hsa', { q: 'hsa', year: '2025', hasAnswer: true })
    expect(w.submenu).toEqual({ in: ['dgnl', 'dgnl-thu'] })
    expect(w.year).toBeUndefined()
    expect(w.dapAnReady).toBeUndefined()
    expect(w.searchKeyEvent).toEqual({ contains: 'hsa' })
  })
  it('blog → posts, searchKeyPost', () => {
    expect(buildCatWhere('blog', { q: 'meo' }).searchKeyPost).toEqual({ contains: 'meo' })
  })
  it('CAT_SOURCES collection + supports flags', () => {
    expect(CAT_SOURCES.thpt.collection).toBe('exams')
    expect(CAT_SOURCES.blog.collection).toBe('posts')
    expect(CAT_SOURCES.hsa.supportsYear).toBe(false)
  })
})
