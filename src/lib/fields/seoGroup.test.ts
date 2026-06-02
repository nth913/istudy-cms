import { describe, it, expect } from 'vitest'
import { seoGroup } from './seoGroup'

describe('seoGroup field config', () => {
  it('là group field tên `seo`', () => {
    expect(seoGroup.type).toBe('group')
    expect(seoGroup.name).toBe('seo')
  })

  it('có 7 sub-field: title, description, ogImage, ogTitle, ogDescription, noindex, canonicalUrl', () => {
    const fieldNames = seoGroup.fields.map((f: any) => f.name)
    expect(fieldNames).toEqual(['title', 'description', 'ogImage', 'ogTitle', 'ogDescription', 'noindex', 'canonicalUrl'])
  })

  it('field title text maxLength 70', () => {
    const title = seoGroup.fields.find((f: any) => f.name === 'title') as any
    expect(title.type).toBe('text')
    expect(title.maxLength).toBe(70)
  })

  it('field description textarea maxLength 200', () => {
    const desc = seoGroup.fields.find((f: any) => f.name === 'description') as any
    expect(desc.type).toBe('textarea')
    expect(desc.maxLength).toBe(200)
  })

  it('field ogImage upload tới media (không filter, cho phép mọi ảnh)', () => {
    const og = seoGroup.fields.find((f: any) => f.name === 'ogImage') as any
    expect(og.type).toBe('upload')
    expect(og.relationTo).toBe('media')
    expect(og.filterOptions).toBeUndefined()
  })

  it('field ogTitle text maxLength 95', () => {
    const og = seoGroup.fields.find((f: any) => f.name === 'ogTitle') as any
    expect(og.type).toBe('text')
    expect(og.maxLength).toBe(95)
  })

  it('field ogDescription textarea maxLength 200', () => {
    const og = seoGroup.fields.find((f: any) => f.name === 'ogDescription') as any
    expect(og.type).toBe('textarea')
    expect(og.maxLength).toBe(200)
  })

  it('has a noindex checkbox defaulting to false', () => {
    const f = seoGroup.fields.find((x: any) => x.name === 'noindex') as any
    expect(f).toBeTruthy()
    expect(f.type).toBe('checkbox')
    expect(f.defaultValue).toBe(false)
  })

  it('has a canonicalUrl text field that validates absolute URLs', () => {
    const f = seoGroup.fields.find((x: any) => x.name === 'canonicalUrl') as any
    expect(f).toBeTruthy()
    expect(f.type).toBe('text')
    expect(f.validate('')).toBe(true)
    expect(f.validate(undefined)).toBe(true)
    expect(f.validate('https://x.com/a')).toBe(true)
    expect(typeof f.validate('notaurl')).toBe('string')
  })
})
