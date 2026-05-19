import { describe, it, expect } from 'vitest'
import { sanitizeFilename } from './filename-sanitize'

describe('sanitizeFilename', () => {
  it('handles Vietnamese diacritics + special chars', () => {
    expect(sanitizeFilename('Đề thi thử 2025!@.pdf')).toBe('de-thi-thu-2025.pdf')
  })

  it('strips special chars from base', () => {
    expect(sanitizeFilename('File (final) v2.PNG')).toBe('file-final-v2.png')
  })

  it('keeps only last dot as extension separator', () => {
    expect(sanitizeFilename('my.file.name.jpg')).toBe('my-file-name.jpg')
  })

  it('truncates very long base', () => {
    const long = 'a'.repeat(200) + '.pdf'
    const out = sanitizeFilename(long)
    expect(out.endsWith('.pdf')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(85)
  })

  it('handles no extension', () => {
    expect(sanitizeFilename('Tài liệu quan trọng')).toBe('tai-lieu-quan-trong')
  })

  it('falls back when base empties', () => {
    expect(sanitizeFilename('!!!.pdf')).toBe('file.pdf')
  })
})
