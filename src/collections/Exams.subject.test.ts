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

  it('enforces ACL on assignedReviewer field', () => {
    const field = Exams.fields.find((f: any) => f.name === 'assignedReviewer')
    expect((field as any).access).toBeDefined()
    expect(typeof (field as any).access.read).toBe('function')
    expect(typeof (field as any).access.update).toBe('function')

    // access.read
    expect((field as any).access.read({ req: { user: { role: 'reviewer' } } })).toBeTruthy()
    expect((field as any).access.read({ req: { user: { role: 'viewer' } } })).toBeFalsy()
    expect((field as any).access.read({ req: { user: null } })).toBeFalsy()

    // access.update
    expect((field as any).access.update({ req: { user: { role: 'editor' } } })).toBeTruthy()
    expect((field as any).access.update({ req: { user: { role: 'reviewer' } } })).toBeFalsy()
    expect((field as any).access.update({ req: { user: null } })).toBeFalsy()
  })

  it('declares notesForReviewer textarea field', () => {
    const n = Exams.fields.find((f: any) => f.name === 'notesForReviewer')
    expect(n).toBeDefined()
    expect((n as any).type).toBe('textarea')
  })

  it('enforces ACL on notesForReviewer field', () => {
    const field = Exams.fields.find((f: any) => f.name === 'notesForReviewer')
    expect((field as any).access).toBeDefined()
    expect(typeof (field as any).access.read).toBe('function')
    expect(typeof (field as any).access.update).toBe('function')

    // access.read
    expect((field as any).access.read({ req: { user: { role: 'reviewer' } } })).toBeTruthy()
    expect((field as any).access.read({ req: { user: { role: 'viewer' } } })).toBeFalsy()
    expect((field as any).access.read({ req: { user: null } })).toBeFalsy()

    // access.update
    expect((field as any).access.update({ req: { user: { role: 'editor' } } })).toBeTruthy()
    expect((field as any).access.update({ req: { user: { role: 'reviewer' } } })).toBeFalsy()
    expect((field as any).access.update({ req: { user: null } })).toBeFalsy()
  })
})

describe('Exams collection — allowOpenInNewTab field', () => {
  it('declares allowOpenInNewTab checkbox in sidebar', () => {
    const f = Exams.fields.find((x: any) => x.name === 'allowOpenInNewTab')
    expect(f).toBeDefined()
    expect((f as any).type).toBe('checkbox')
    expect((f as any).defaultValue).toBe(false)
    expect((f as any).admin?.position).toBe('sidebar')
  })

  it('has Vietnamese description explaining watermark bypass', () => {
    const f = Exams.fields.find((x: any) => x.name === 'allowOpenInNewTab')
    const desc = (f as any).admin?.description ?? ''
    expect(desc).toContain('Mở tab mới')
    expect(desc).toContain('watermark')
  })
})
