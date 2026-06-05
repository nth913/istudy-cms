import { describe, it, expect } from 'vitest'
import { Vao10Config } from './Vao10Config'

describe('Vao10Config global', () => {
  it('has slug vao10-2026-config', () => {
    expect(Vao10Config.slug).toBe('vao10-2026-config')
  })

  it('access: read is always true', () => {
    expect((Vao10Config.access as any).read()).toBe(true)
  })

  it('access: update allows admin and editor only', () => {
    const update = (Vao10Config.access as any).update
    expect(update({ req: { user: { role: 'admin' } } })).toBe(true)
    expect(update({ req: { user: { role: 'editor' } } })).toBe(true)
    expect(update({ req: { user: { role: 'reviewer' } } })).toBe(false)
    expect(update({ req: { user: null } })).toBe(false)
  })

  describe('items array field', () => {
    const fields = Vao10Config.fields as any[]
    const itemsField = fields.find((f) => f.name === 'items')

    it('exists as type array with maxRows 40', () => {
      expect(itemsField).toBeDefined()
      expect(itemsField.type).toBe('array')
      expect(itemsField.maxRows).toBe(40)
    })

    const rowFields = Object.fromEntries(
      ((itemsField?.fields ?? []) as any[]).map((f: any) => [f.name, f]),
    )

    it('row has provinceName as required text', () => {
      expect(rowFields.provinceName).toBeDefined()
      expect(rowFields.provinceName.type).toBe('text')
      expect(rowFields.provinceName.required).toBe(true)
    })

    it('row has exam as relationship to exams collection', () => {
      expect(rowFields.exam).toBeDefined()
      expect(rowFields.exam.type).toBe('relationship')
      expect(rowFields.exam.relationTo).toBe('exams')
    })

    it('row has thumbnail as upload to media', () => {
      expect(rowFields.thumbnail).toBeDefined()
      expect(rowFields.thumbnail.type).toBe('upload')
      expect(rowFields.thumbnail.relationTo).toBe('media')
      expect(rowFields.thumbnail.filterOptions).toBeUndefined()
    })
  })
})
