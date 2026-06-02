// istudy-cms/src/endpoints/search.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchEndpoint, searchMetaEndpoint } from './search'
import * as searchIndexModule from '../lib/search-index'
import { markSearchDirty } from '../lib/search-index'

beforeEach(() => { markSearchDirty() })

function mockReq(query: Record<string, string>, finders: Record<string, any[]>) {
  return {
    url: `/api/search?${new URLSearchParams(query)}`,
    payload: {
      find: vi.fn(async ({ collection }: any) => ({
        docs: finders[collection] ?? [],
        totalDocs: (finders[collection] ?? []).length,
      })),
      findGlobal: vi.fn(async () => finders.searchConfig?.[0] ?? {}),
      count: vi.fn(async () => ({ totalDocs: 0 })),
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
    // searchKey/searchKeyEvent/searchKeyPost are required for the index path to match docs.
    // All 4 docs include the token "de" so the index finds them under a single query.
    const exams = [
      { id: 'e1', title: 'Đề THPT 2025', slug: 'de-thpt-2025', category: 'vao-dai-hoc', examType: 'chinh-thuc', year: '2025', dapAnReady: true, searchKey: 'de thpt 2025' },
      { id: 'e2', title: 'Đề vào 10 Hà Nội', slug: 'de-vao-10-hn', category: 'vao-10', examType: 'thi-thu', year: '2024', searchKey: 'de vao 10 ha noi' },
    ]
    const events = [{ id: 'ev1', title: 'HSA Đợt 1', slug: 'hsa-dot-1', submenu: 'dgnl', startAt: '2026-06-27T00:00:00.000Z', searchKeyEvent: 'de hsa dot 1' }]
    const posts = [{ id: 'p1', title: 'Mẹo Đọc', slug: 'meo-doc', category: 'meo', publishedAt: '2026-05-01', searchKeyPost: 'de meo doc' }]
    const res = await searchEndpoint.handler!(mockReq({ q: 'de' }, { exams, events, posts }))
    expect(res.status).toBe(200)
    const body = await res.json()
    // Index path: results ranked, each bucket must contain the correct doc.
    expect(body.thpt.some((r: any) => r.href === '/de-thi-chi-tiet/de-thpt-2025')).toBe(true)
    expect(body.l10.some((r: any) => r.href === '/de-thi-chi-tiet/de-vao-10-hn')).toBe(true)
    expect(body.hsa.some((r: any) => r.href === '/kho-de-thi?event=hsa-dot-1')).toBe(true)
    expect(body.blog.some((r: any) => r.href === '/bai-viet-chi-tiet/meo-doc')).toBe(true)
    expect(body.total).toBe(4)
  })

  it('clamps limit to 20 (per-bucket result count never exceeds 20)', async () => {
    // Build an index with 25 exams all matching "de". With limit=999, output per bucket must be clamped to 20.
    const manyExams = Array.from({ length: 25 }, (_, i) => ({
      id: `x${i}`, title: `Đề tham khảo ${i}`, slug: `de-${i}`, category: 'vao-dai-hoc',
      examType: 'chinh-thuc', year: '2025', searchKey: `de tham khao ${i}`,
    }))
    const res = await searchEndpoint.handler!(mockReq({ q: 'de', limit: '999' }, { exams: manyExams, events: [], posts: [] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.thpt.length).toBeLessThanOrEqual(20)
  })
})

describe('searchEndpoint via index', () => {
  it('returns ranked + bucketed results from the index', async () => {
    const exams = [
      { id: 'e1', title: 'Đề tham khảo THPT 2025', slug: 'de-thpt-2025', category: 'vao-dai-hoc', examType: 'chinh-thuc', year: '2025', dapAnReady: true, searchKey: 'de tham khao thpt 2025' },
    ]
    const res = await searchEndpoint.handler!(mockReq({ q: 'tham khao' }, { exams, events: [], posts: [] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.thpt[0].href).toBe('/de-thi-chi-tiet/de-thpt-2025')
    expect(body.total).toBeGreaterThanOrEqual(1)
  })

  it('exposes order array from index path', async () => {
    const exams = [
      { id: 'e1', title: 'Đề tham khảo THPT 2025', slug: 'de-thpt-2025', category: 'vao-dai-hoc', examType: 'chinh-thuc', year: '2025', searchKey: 'de tham khao thpt 2025' },
    ]
    const res = await searchEndpoint.handler!(mockReq({ q: 'tham khao' }, { exams, events: [], posts: [] }))
    const body = await res.json()
    expect(Array.isArray(body.order)).toBe(true)
    expect(body.order).toHaveLength(4)
    expect(body.order[0]).toBe('thpt')   // chỉ thpt match → đứng đầu
  })
})

describe('searchEndpoint fallback', () => {
  it('falls back to regex find when the index build throws', async () => {
    const spy = vi.spyOn(searchIndexModule, 'queryIndex').mockRejectedValueOnce(new Error('index boom'))
    const exams = [
      { id: 'e1', title: 'Đề THPT', slug: 'de-thpt', category: 'vao-dai-hoc', examType: 'chinh-thuc', year: '2025', searchKey: 'de thpt' },
    ]
    const res = await searchEndpoint.handler!(mockReq({ q: 'de' }, { exams, events: [], posts: [] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.thpt).toHaveLength(1)
    spy.mockRestore()
  })

  it('regex fallback returns canonical order', async () => {
    const spy = vi.spyOn(searchIndexModule, 'queryIndex').mockRejectedValueOnce(new Error('index boom'))
    const exams = [
      { id: 'e1', title: 'Đề THPT', slug: 'de-thpt', category: 'vao-dai-hoc', examType: 'chinh-thuc', year: '2025', searchKey: 'de thpt' },
    ]
    const res = await searchEndpoint.handler!(mockReq({ q: 'de' }, { exams, events: [], posts: [] }))
    const body = await res.json()
    expect(body.order).toEqual(['thpt', 'l10', 'hsa', 'blog'])
    spy.mockRestore()
  })
})

describe('searchMetaEndpoint', () => {
  it('returns shape + cache header', async () => {
    // Now popularTags comes from the `tags` collection (computed), provinces from exams aggregate.
    // mockReq routes find({collection}) to finders[collection].
    const req = mockReq({}, {
      searchConfig: [{ trendingItems: [{ label: 'A', delta: '+10%' }], maxTagsSuggest: 3, maxProvincesSuggest: 3 }],
      // tags collection: 1 tag with usageCount>0 (the helper queries where usageCount>0)
      tags: [{ id: 't1', name: 'X', slug: 'x', hot: true, usageCount: 5, popularScore: 5 }],
      // exams collection: one vao-10 exam with province, plus a hot exam for featured
      exams: [
        { id: 'f1', title: 'Top Đề', slug: 'top', category: 'vao-dai-hoc', year: '2025', views: 9999 },
        { id: 'e1', province: 'pHN', views: 100, category: 'vao-10' },
      ],
      // provinces collection for the aggregate lookup
      provinces: [{ id: 'pHN', name: 'Hà Nội' }],
    })
    const res = await searchMetaEndpoint.handler!(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toMatch(/max-age=60/)
    const body = await res.json()
    expect(body.popularTags).toHaveLength(1)
    expect(body.popularTags[0]).toMatchObject({ id: 't1', label: 'X', slug: 'x', hot: true })
    expect(body.provinces).toEqual(['Hà Nội'])
    expect(body.trending[0].rank).toBe(1)
    expect(body.featured).not.toBeNull()
  })

  it('featured null when no exam found', async () => {
    const req = mockReq({}, {
      searchConfig: [{ trendingItems: [], maxTagsSuggest: 3, maxProvincesSuggest: 3 }],
      tags: [],
      exams: [],
      provinces: [],
    })
    const res = await searchMetaEndpoint.handler!(req)
    const body = await res.json()
    expect(body.featured).toBeNull()
  })
})

describe('searchMetaEndpoint trending cap', () => {
  it('meta caps trending to maxTrendingSuggest', async () => {
    const { searchMetaEndpoint } = await import('./search')
    const req = mockReq({}, {
      searchConfig: [{ maxTrendingSuggest: 2, trendingItems: [
        { label: 'A', delta: '+1%' }, { label: 'B', delta: null }, { label: 'C', delta: null },
      ] }],
      tags: [], exams: [], provinces: [],
    })
    const res = await searchMetaEndpoint.handler!(req)
    const body = await res.json()
    expect(body.trending).toHaveLength(2)
    expect(body.trending.map((t: any) => t.label)).toEqual(['A', 'B'])
  })
})

describe('searchEndpoint counts', () => {
  it('response includes per-cat counts (uncapped, via payload.count)', async () => {
    const exams = [
      { id: 'e1', title: 'Đề THPT 2025', slug: 'de-thpt-2025', category: 'vao-dai-hoc', examType: 'chinh-thuc', year: '2025', searchKey: 'de thpt 2025' },
    ]
    const req = mockReq({ q: 'de' }, { exams, events: [], posts: [] })
    req.payload.count = vi.fn()
      .mockResolvedValueOnce({ totalDocs: 12 }) // thpt
      .mockResolvedValueOnce({ totalDocs: 9 })  // l10
      .mockResolvedValueOnce({ totalDocs: 0 })  // hsa
      .mockResolvedValueOnce({ totalDocs: 2 })  // blog
    const res = await searchEndpoint.handler!(req as any)
    const body = await res.json()
    expect(body.counts).toEqual({ thpt: 12, l10: 9, hsa: 0, blog: 2 })
  })
})
