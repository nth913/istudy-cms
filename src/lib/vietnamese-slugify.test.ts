import { describe, it, expect } from 'vitest'
import { vietnameseSlugify, removeVietnameseDiacritics } from './vietnamese-slugify'

describe('vietnameseSlugify', () => {
  it('removes diacritics and lowercases', () => {
    expect(vietnameseSlugify('Tiếng Anh')).toBe('tieng-anh')
  })
  it('handles complex Vietnamese characters', () => {
    expect(vietnameseSlugify('Đắk Lắk')).toBe('dak-lak')
    expect(vietnameseSlugify('Hoà Bình')).toBe('hoa-binh')
    expect(vietnameseSlugify('TP. Hồ Chí Minh')).toBe('tp-ho-chi-minh')
  })
  it('collapses whitespace and special chars to hyphen', () => {
    expect(vietnameseSlugify('  Đề thi  thử  ')).toBe('de-thi-thu')
  })
})

describe('removeVietnameseDiacritics', () => {
  it('strips diacritics but preserves case', () => {
    expect(removeVietnameseDiacritics('Hà Nội')).toBe('Ha Noi')
  })
})
