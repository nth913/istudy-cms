// src/endpoints/search-config.test.ts
import { describe, it, expect, vi } from 'vitest'
import { searchConfigEndpoint } from './search-config'

function mkReq(global: any) {
  return { payload: { findGlobal: vi.fn(async () => global) } } as any
}

describe('searchConfigEndpoint', () => {
  it('maps SearchConfig global → DTO', async () => {
    const res = await searchConfigEndpoint.handler!(mkReq({
      maxTagsSuggest: 5, maxProvincesSuggest: 4, maxTrendingSuggest: 2, loadingTimeoutMs: 8000,
      defaultTags: [{ id: 'thpt', label: 'THPT', hot: true }],
      defaultProvinces: [{ name: 'Hà Nội' }],
      defaultTrending: [{ label: 'Nghệ An', href: '/de-thi-chi-tiet/x', delta: '+5%' }],
    }))
    const body = await res.json()
    expect(body).toMatchObject({
      maxTags: 5, maxProvinces: 4, maxTrending: 2, loadingTimeoutMs: 8000,
      defaultTags: [{ id: 'thpt', label: 'THPT', hot: true }],
      defaultProvinces: ['Hà Nội'],
      defaultTrending: [{ label: 'Nghệ An', href: '/de-thi-chi-tiet/x', delta: '+5%' }],
    })
    expect(res.headers.get('Cache-Control')).toMatch(/max-age=60/)
  })
  it('applies defaults when global empty', async () => {
    const res = await searchConfigEndpoint.handler!(mkReq({}))
    const body = await res.json()
    expect(body).toMatchObject({ maxTags: 3, maxProvinces: 3, maxTrending: 3, loadingTimeoutMs: 13000, defaultTags: [], defaultProvinces: [], defaultTrending: [] })
  })
})
