import { describe, it, expect } from 'vitest'
import { normalizeSlug } from './normalizeSlug'
import { computeSearchKey } from './computeSearchKey'

describe('normalizeSlug', () => {
  it('normalizes slug to vietnamese-slugify form', () => {
    const result = normalizeSlug({ data: { slug: 'Tiếng Anh THCS' } } as any)
    expect(result.slug).toBe('tieng-anh-thcs')
  })
  it('preserves existing valid slug', () => {
    const result = normalizeSlug({ data: { slug: 'de-thi-thu-2024' } } as any)
    expect(result.slug).toBe('de-thi-thu-2024')
  })
  it('no-op when slug missing', () => {
    const result = normalizeSlug({ data: {} } as any)
    expect(result.slug).toBeUndefined()
  })
})

describe('computeSearchKey', () => {
  it('concatenates title + school then strips diacritics + lowercases', () => {
    const result = computeSearchKey({
      data: { title: 'Đề thi vào 10 Tiếng Anh', school: 'THCS Trần Phú' },
    } as any)
    expect(result.searchKey).toBe('de thi vao 10 tieng anh thcs tran phu')
  })
  it('handles missing school', () => {
    const result = computeSearchKey({ data: { title: 'Đề thi' } } as any)
    expect(result.searchKey).toBe('de thi')
  })
})
