// istudy-cms/src/endpoints/search.test.ts
import { describe, expect, it, vi } from 'vitest'
import { searchEndpoint, searchMetaEndpoint } from './search'

function mockReq(query: Record<string, string>, finders: Record<string, any[]>) {
  return {
    url: `/api/search?${new URLSearchParams(query)}`,
    payload: {
      find: vi.fn(async ({ collection }: any) => ({
        docs: finders[collection] ?? [],
        totalDocs: (finders[collection] ?? []).length,
      })),
      findGlobal: vi.fn(async () => finders.searchConfig?.[0] ?? {}),
    },
  } as any
}

describe('searchEndpoint', () => {
  it('returns 400 when q missing', async () => {
    const res = await searchEndpoint.handler!(mockReq({}, {}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Thiếu/)
  })

  it('returns 400 when q too long', async () => {
    const res = await searchEndpoint.handler!(mockReq({ q: 'a'.repeat(101) }, {}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/quá dài/)
  })

  it('returns shape with 4 cat arrays + total', async () => {
    const exams = [
      { id: 'e1', title: 'Đề THPT 2025', slug: 'de-thpt-2025', category: 'vao-dai-hoc', examType: 'chinh-thuc', year: '2025', dapAnReady: true },
      { id: 'e2', title: 'Đề vào 10 Hà Nội', slug: 'de-vao-10-hn', category: 'vao-10', examType: 'thi-thu', year: '2024' },
    ]
    const events = [{ id: 'ev1', title: 'HSA Đợt 1', slug: 'hsa-dot-1', submenu: 'dgnl', startAt: '2026-06-27T00:00:00.000Z' }]
    const posts = [{ id: 'p1', title: 'Mẹo Đọc', slug: 'meo-doc', category: 'meo', publishedAt: '2026-05-01' }]
    const res = await searchEndpoint.handler!(mockReq({ q: 'de' }, { exams, events, posts }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.thpt).toHaveLength(1)
    expect(body.l10).toHaveLength(1)
    expect(body.hsa).toHaveLength(1)
    expect(body.blog).toHaveLength(1)
    expect(body.total).toBe(4)
    expect(body.thpt[0].href).toBe('/de-thi-chi-tiet/de-thpt-2025')
    expect(body.l10[0].href).toBe('/de-thi-chi-tiet/de-vao-10-hn')
    expect(body.hsa[0].href).toBe('/kho-de-thi?event=hsa-dot-1')
    expect(body.blog[0].href).toBe('/bai-viet-chi-tiet/meo-doc')
  })

  it('clamps limit to 20', async () => {
    const req = mockReq({ q: 'de', limit: '999' }, { exams: [], events: [], posts: [] })
    await searchEndpoint.handler!(req)
    const findCalls = (req.payload.find as any).mock.calls
    findCalls.forEach((c: any[]) => expect(c[0].limit).toBeLessThanOrEqual(20))
  })
})

describe('searchMetaEndpoint', () => {
  it('returns shape + cache header', async () => {
    const req = mockReq({}, {
      searchConfig: [{ popularTags: [{ id: 't1', label: 'X', hot: true }], provinces: [{ name: 'Hà Nội' }], trendingItems: [{ label: 'A', delta: '+10%' }] }],
      exams: [{ id: 'f1', title: 'Top Đề', slug: 'top', category: 'vao-dai-hoc', year: '2025', views: 9999 }],
    })
    const res = await searchMetaEndpoint.handler!(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toMatch(/max-age=60/)
    const body = await res.json()
    expect(body.popularTags).toHaveLength(1)
    expect(body.provinces).toEqual(['Hà Nội'])
    expect(body.trending[0].rank).toBe(1)
    expect(body.featured).not.toBeNull()
  })

  it('featured null when no exam found', async () => {
    const req = mockReq({}, { searchConfig: [{ popularTags: [], provinces: [], trendingItems: [] }], exams: [] })
    const res = await searchMetaEndpoint.handler!(req)
    const body = await res.json()
    expect(body.featured).toBeNull()
  })
})
