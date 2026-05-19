import { describe, it, expect } from 'vitest'
import { Exams } from './Exams'

describe('Exams collection — subject relation', () => {
  it('declares subject as optional relationship to subjects', () => {
    const subjectField = Exams.fields.find(
      (f: any) => f.name === 'subject',
    )
    expect(subjectField).toBeDefined()
    expect((subjectField as any).type).toBe('relationship')
    expect((subjectField as any).relationTo).toBe('subjects')
    expect((subjectField as any).required).toBeFalsy()
  })

  it('declares assignedReviewer relation to users (admin/editor only)', () => {
    const r = Exams.fields.find((f: any) => f.name === 'assignedReviewer')
    expect(r).toBeDefined()
    expect((r as any).type).toBe('relationship')
    expect((r as any).relationTo).toBe('users')
  })

  it('declares notesForReviewer textarea field', () => {
    const n = Exams.fields.find((f: any) => f.name === 'notesForReviewer')
    expect(n).toBeDefined()
    expect((n as any).type).toBe('textarea')
  })
})
