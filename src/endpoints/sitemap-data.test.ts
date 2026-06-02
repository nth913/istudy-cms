import { describe, it, expect, vi } from 'vitest'
import { sitemapDataEndpoint } from './sitemap-data'

describe('sitemap-data', () => {
  it('filters out noindex records for exams/posts/books', async () => {
    if (typeof (globalThis as any).Response === 'undefined') {
      ;(globalThis as any).Response = { json: (x: any) => ({ body: x }) } as any
    }
    const wheres: any[] = []
    const payload = { find: vi.fn(async ({ where }: any) => { wheres.push(where); return { docs: [] } }) }
    const req: any = { payload }
    await (sitemapDataEndpoint as any).handler(req)
    for (const w of wheres.slice(0, 3)) {
      expect(w._status).toEqual({ equals: 'published' })
      expect(w['seo.noindex']).toEqual({ not_equals: true })
    }
  })
})
