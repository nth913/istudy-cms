import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchExamsEndpoint, searchExamsGetEndpoint } from './search-exams'

// ---------- POST /api/exams/search (existing endpoint, backward compat) ----------

const buildPostReq = (body: any, findMock?: any) => ({
  json: vi.fn().mockResolvedValue(body),
  payload: {
    find:
      findMock ||
      vi.fn().mockResolvedValue({
        docs: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      }),
  },
})

describe('searchExamsEndpoint (POST backward compat)', () => {
  it('returns 400 when category missing', async () => {
    const req = buildPostReq({})
    const res = (await searchExamsEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('category required')
  })

  it('passes category filter into where clause', async () => {
    const findMock = vi.fn().mockResolvedValue({
      docs: [{ id: 'e1', slug: 's1' }],
      totalDocs: 1,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })
    const req = buildPostReq({ category: 'vao-10' }, findMock)
    const res = (await searchExamsEndpoint.handler!(req as any)) as Response
    expect(res.status).toBe(200)
    const examsCall = findMock.mock.calls[0][0]
    expect(examsCall.collection).toBe('exams')
    expect(examsCall.where.category).toEqual({ equals: 'vao-10' })
    expect(examsCall.where._status).toEqual({ equals: 'published' })
  })

  it('resolves provinceSlug to province id', async () => {
    const findMock = vi
      .fn()
      .mockResolvedValueOnce({ docs: [{ id: 'prov-abc' }] }) // provinces
      .mockResolvedValueOnce({
        docs: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      }) // exams
    const req = buildPostReq({ category: 'vao-10', provinceSlug: 'ha-noi' }, findMock)
    await searchExamsEndpoint.handler!(req as any)
    const examsCall = findMock.mock.calls[1][0]
    expect(examsCall.where.province).toEqual({ equals: 'prov-abc' })
  })
})

// ---------- GET /api/search-exams (new extended endpoint) ----------

const makeExams = () => [
  {
    id: 'ex-a',
    slug: 'a-vao-10-hn',
    category: 'vao-10',
    examType: 'chinh-thuc',
    province: { id: 'p-hn', slug: 'ha-noi' },
    year: '2026',
    views: 100,
    _status: 'published',
  },
  {
    id: 'ex-b',
    slug: 'b-thpt-2025',
    category: 'vao-dai-hoc',
    examType: 'chinh-thuc',
    province: null,
    year: '2025',
    views: 500,
    _status: 'published',
  },
  {
    id: 'ex-c',
    slug: 'c-vao-10-tphcm',
    category: 'vao-10',
    examType: 'thi-thu',
    province: { id: 'p-hcm', slug: 'tphcm' },
    year: '2026',
    views: 200,
    _status: 'published',
  },
]

// Extended fixture for examType + yearMax filter tests (covers thi-thu + older years).
const makeExamsExtended = () => [
  ...makeExams(),
  {
    id: 'ex-d',
    slug: 'd-vao-10-thi-thu-2022',
    category: 'vao-10',
    examType: 'thi-thu',
    province: { id: 'p-hn', slug: 'ha-noi' },
    year: '2022',
    views: 50,
    _status: 'published',
  },
  {
    id: 'ex-e',
    slug: 'e-vao-10-chinh-thuc-2020',
    category: 'vao-10',
    examType: 'chinh-thuc',
    province: { id: 'p-hn', slug: 'ha-noi' },
    year: '2020',
    views: 10,
    _status: 'published',
  },
]

/**
 * Simulate Payload `find` against an in-memory exam table.
 * - `provinces` lookup resolves slug → id
 * - `exams` lookup applies where filters (category, year, province.equals, _status)
 *   + sort (-views, -createdAt, -viewsThisWeek) + limit/page (offset = (page-1)*limit)
 */
const makePayload = (exams = makeExams()) => {
  const provinces: Record<string, { id: string; slug: string }> = {
    'ha-noi': { id: 'p-hn', slug: 'ha-noi' },
    tphcm: { id: 'p-hcm', slug: 'tphcm' },
  }

  const find = vi.fn(async (args: any) => {
    if (args.collection === 'provinces') {
      const slug = args.where?.slug?.equals
      const prov = slug ? provinces[slug] : undefined
      return { docs: prov ? [prov] : [], totalDocs: prov ? 1 : 0 }
    }
    if (args.collection === 'exams') {
      let rows = [...exams]
      const w = args.where || {}
      if (w._status?.equals) rows = rows.filter((e) => e._status === w._status.equals)
      if (w.category?.equals) rows = rows.filter((e) => e.category === w.category.equals)
      if (w.examType?.equals) rows = rows.filter((e) => e.examType === w.examType.equals)
      if (w.year?.equals) rows = rows.filter((e) => e.year === w.year.equals)
      if (w.year?.less_than_equal != null) {
        rows = rows.filter((e) => Number(e.year) <= Number(w.year.less_than_equal))
      }
      if (w.province?.equals) {
        rows = rows.filter((e) => e.province?.id === w.province.equals)
      }
      const sort: string = args.sort || '-createdAt'
      if (sort === '-views') rows.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      // -createdAt + -viewsThisWeek → keep insertion order (deterministic for tests)
      const limit = args.limit ?? 20
      const page = args.page ?? 1
      const start = (page - 1) * limit
      const docs = rows.slice(start, start + limit)
      return { docs, totalDocs: rows.length, page, totalPages: Math.ceil(rows.length / limit) }
    }
    return { docs: [], totalDocs: 0 }
  })

  return { find }
}

const buildGetReq = (path: string, payload?: any) => ({
  url: `http://localhost${path}`,
  payload: payload || makePayload(),
})

describe('search-exams extended (GET /api/search-exams)', () => {
  let req: any
  beforeEach(() => {
    req = null
  })

  it('filters ?cat=vao-10', async () => {
    req = buildGetReq('/api/search-exams?cat=vao-10')
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.map((e: any) => e.slug).sort()).toEqual([
      'a-vao-10-hn',
      'c-vao-10-tphcm',
    ])
  })

  it('filters ?province=ha-noi', async () => {
    req = buildGetReq('/api/search-exams?province=ha-noi')
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    const body = await res.json()
    expect(body.items.map((e: any) => e.slug)).toEqual(['a-vao-10-hn'])
  })

  it('combo ?cat=vao-10&year=2026', async () => {
    req = buildGetReq('/api/search-exams?cat=vao-10&year=2026')
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    const body = await res.json()
    expect(body.items.length).toBe(2)
  })

  it('sort=views desc', async () => {
    req = buildGetReq('/api/search-exams?sort=views')
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    const body = await res.json()
    expect(body.items[0].slug).toBe('b-thpt-2025')
  })

  it('pagination limit=2&offset=1', async () => {
    req = buildGetReq('/api/search-exams?limit=2&offset=1')
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    const body = await res.json()
    expect(body.items.length).toBe(2)
    expect(body.limit).toBe(2)
    expect(body.offset).toBe(1)
    expect(body.total).toBe(3)
  })

  it('invalid year returns 400', async () => {
    req = buildGetReq('/api/search-exams?year=abc')
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('không hợp lệ')
  })

  it('province slug not found = silent no-filter', async () => {
    req = buildGetReq('/api/search-exams?province=khong-ton-tai')
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBe(3)
  })

  it('clamps limit to max 50', async () => {
    const payload = makePayload()
    req = buildGetReq('/api/search-exams?limit=999', payload)
    await searchExamsGetEndpoint.handler!(req)
    const examsCall = (payload.find as any).mock.calls.find(
      (c: any[]) => c[0].collection === 'exams',
    )
    expect(examsCall[0].limit).toBe(50)
  })

  it('defaults to sort=latest (-createdAt) when sort param missing', async () => {
    const payload = makePayload()
    req = buildGetReq('/api/search-exams', payload)
    await searchExamsGetEndpoint.handler!(req)
    const examsCall = (payload.find as any).mock.calls.find(
      (c: any[]) => c[0].collection === 'exams',
    )
    expect(examsCall[0].sort).toBe('-createdAt')
  })

  it('GET filter theo examType', async () => {
    const payload = makePayload(makeExamsExtended())
    req = buildGetReq('/api/search-exams?cat=vao-10&examType=thi-thu&limit=50', payload)
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.items.length).toBeGreaterThan(0)
    expect(json.items.every((d: any) => d.examType === 'thi-thu')).toBe(true)
  })

  it('GET filter theo yearMax (year <= X)', async () => {
    const payload = makePayload(makeExamsExtended())
    req = buildGetReq('/api/search-exams?cat=vao-10&yearMax=2022&limit=50', payload)
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.items.length).toBeGreaterThan(0)
    expect(json.items.every((d: any) => Number(d.year) <= 2022)).toBe(true)
  })

  it('GET reject yearMax invalid', async () => {
    req = buildGetReq('/api/search-exams?cat=vao-10&yearMax=abc')
    const res = (await searchExamsGetEndpoint.handler!(req)) as Response
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('không hợp lệ')
  })
})
