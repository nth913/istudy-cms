import { describe, it, expect } from 'vitest'
import { SeoConfig } from './SeoConfig'

describe('SeoConfig global', () => {
  it('slug seo-config, group Settings', () => {
    expect(SeoConfig.slug).toBe('seo-config')
    expect(SeoConfig.admin?.group).toBe('Settings')
  })

  it('access read public, update admin only', () => {
    expect(typeof SeoConfig.access?.read).toBe('function')
    expect(typeof SeoConfig.access?.update).toBe('function')
    expect((SeoConfig.access!.read as any)({} as any)).toBe(true)
    expect((SeoConfig.access!.update as any)({ req: { user: { role: 'admin' } } })).toBe(true)
    expect((SeoConfig.access!.update as any)({ req: { user: { role: 'editor' } } })).toBe(false)
    expect((SeoConfig.access!.update as any)({ req: { user: null } })).toBe(false)
  })

  it('có field siteName, twitterHandle, defaultTitle, defaultTitleSuffix, defaultDescription, defaultOgImage', () => {
    const names = SeoConfig.fields.map((f: any) => f.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'siteName', 'twitterHandle', 'defaultTitle',
        'defaultTitleSuffix', 'defaultDescription',
        'defaultOgImage', 'collectionDefaults',
      ])
    )
  })

  it('collectionDefaults group có 4 sub-group posts/exams/events/books', () => {
    const cd = SeoConfig.fields.find((f: any) => f.name === 'collectionDefaults') as any
    expect(cd.type).toBe('group')
    const subNames = cd.fields.map((f: any) => f.name)
    expect(subNames).toEqual(['posts', 'exams', 'events', 'books'])
  })

  it('mỗi collection default group có field ogImage upload media filter purpose=og_image', () => {
    const cd = SeoConfig.fields.find((f: any) => f.name === 'collectionDefaults') as any
    for (const sub of cd.fields) {
      const og = sub.fields.find((f: any) => f.name === 'ogImage') as any
      expect(og.type).toBe('upload')
      expect(og.relationTo).toBe('media')
      expect(og.filterOptions).toEqual({ purpose: { equals: 'og_image' } })
    }
  })
})
