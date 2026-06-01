import { describe, it, expect } from 'vitest'
import { examToResult } from '../search-index'

describe('examToResult', () => {
  it('exposes year for grouping + keeps existing shape', () => {
    const r = examToResult({ id: 'x1', slug: 'de-2025', title: 'Đề 2025', category: 'vao-dai-hoc', examType: 'minh-hoa', year: '2025', dapAnReady: true })
    expect(r).toMatchObject({ id: 'x1', cat: 'thpt', href: '/de-thi-chi-tiet/de-2025', year: '2025' })
    expect(r.meta).toContain('Năm 2025')
    expect(r.meta).toContain('Có đáp án')
  })
  it('year undefined when absent', () => {
    expect(examToResult({ id: 'a', slug: 's', title: 't', category: 'vao-10' }).year).toBeUndefined()
  })
})
