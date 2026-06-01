import { describe, it, expect } from 'vitest'
import { examFacetTagNames, EXAM_TYPE_LABELS } from './bootstrap-tags'

describe('examFacetTagNames', () => {
  it('derives tag names from examType + year + subject', () => {
    const names = examFacetTagNames({ examType: 'minh-hoa', year: '2025', subject: { name: 'Tiếng Anh' } })
    expect(names).toContain(EXAM_TYPE_LABELS['minh-hoa'])
    expect(names).toContain('Đề 2025')
    expect(names).toContain('Tiếng Anh')
  })
  it('handles missing subject/year gracefully', () => {
    const names = examFacetTagNames({ examType: 'thi-thu' })
    expect(names).toEqual([EXAM_TYPE_LABELS['thi-thu']])
  })
})
