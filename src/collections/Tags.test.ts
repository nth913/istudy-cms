import { describe, it, expect } from 'vitest'
import { Tags } from './Tags'
import { vietnameseSlugify } from '../lib/vietnamese-slugify'

function runBeforeValidate(data: any) {
  const hook = (Tags.hooks?.beforeValidate ?? [])[0] as any
  return hook({ data })
}

describe('Tags collection', () => {
  it('has slug + usageCount + popularScore + hot fields', () => {
    const names = (Tags.fields as any[]).map((f) => f.name)
    expect(names).toEqual(expect.arrayContaining(['name', 'slug', 'hot', 'usageCount', 'popularScore']))
  })

  it('normalizes slug from Vietnamese name on beforeValidate', () => {
    const out = runBeforeValidate({ name: 'Đề minh hoạ', slug: 'Đề minh hoạ' })
    expect(out.slug).toBe(vietnameseSlugify('Đề minh hoạ'))
    expect(out.slug).toBe('de-minh-hoa')
  })

  it('derives slug from name when slug empty', () => {
    const out = runBeforeValidate({ name: 'Word Formation', slug: '' })
    expect(out.slug).toBe('word-formation')
  })
})
