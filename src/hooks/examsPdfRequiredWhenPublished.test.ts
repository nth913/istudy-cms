import { describe, it, expect } from 'vitest'
import { examsPdfRequiredWhenPublished } from './examsPdfRequiredWhenPublished'

describe('examsPdfRequiredWhenPublished', () => {
  it('passes when status=draft and no pdfFile', () => {
    const data = { _status: 'draft', pdfFile: null }
    expect(() => examsPdfRequiredWhenPublished({ data } as any)).not.toThrow()
  })

  it('passes when status=published and pdfFile exists', () => {
    const data = { _status: 'published', pdfFile: 'media-id-123' }
    expect(() => examsPdfRequiredWhenPublished({ data } as any)).not.toThrow()
  })

  it('throws VN error when status=published and no pdfFile', () => {
    const data = { _status: 'published', pdfFile: null }
    expect(() => examsPdfRequiredWhenPublished({ data } as any)).toThrow(
      'Phải upload file PDF đề trước khi publish',
    )
  })
})
