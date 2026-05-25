import { describe, it, expect, vi, beforeEach } from 'vitest'
import { megaMenuKhoDeEndpoint, __resetMegaMenuCache } from './mega-menu-kho-de'

/**
 * Fixtures: simulate Payload `find` against an in-memory exam table.
 * Filter fields supported: category, examType, _status, 'tags.hot.enabled', slug.not_in
 * Sort supported: '-views', '-createdAt'
 */
type ExamFixture = {
  id: string
  slug: string
  title: string
  year: string
  category: string
  examType: string
  views?: number
  _status: string
  createdAt?: string
  deReady?: boolean
  tags?: {
    hot?: { enabled?: boolean; expiresAt?: string | null }
  }
}

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

const makeExams = (): ExamFixture[] => [
  // vao-10 chinh-thuc: 3 years (2026, 2025, 2024) — 1 doc each (+1 extra 2026 to test counts>1)
  {
    id: 'v10-ct-2026-a',
    slug: 'v10-ct-2026-a',
    title: 'Vào 10 Hà Nội 2026',
    year: '2026',
    category: 'vao-10',
    examType: 'chinh-thuc',
    _status: 'published',
    createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'v10-ct-2026-b',
    slug: 'v10-ct-2026-b',
    title: 'Vào 10 TP.HCM 2026',
    year: '2026',
    category: 'vao-10',
    examType: 'chinh-thuc',
    _status: 'published',
    createdAt: '2026-06-02T00:00:00Z',
  },
  {
    id: 'v10-ct-2025-a',
    slug: 'v10-ct-2025-a',
    title: 'Vào 10 Hà Nội 2025',
    year: '2025',
    category: 'vao-10',
    examType: 'chinh-thuc',
    _status: 'published',
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'v10-ct-2024-a',
    slug: 'v10-ct-2024-a',
    title: 'Vào 10 Hà Nội 2024',
    year: '2024',
    category: 'vao-10',
    examType: 'chinh-thuc',
    _status: 'published',
    createdAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'v10-ct-2023-a',
    slug: 'v10-ct-2023-a',
    title: 'Vào 10 Hà Nội 2023 (older, should not appear in top 3)',
    year: '2023',
    category: 'vao-10',
    examType: 'chinh-thuc',
    _status: 'published',
    createdAt: '2023-06-01T00:00:00Z',
  },
  // vao-10 chinh-thuc HOT (views, hot.enabled, expiresAt future, deReady)
  {
    id: 'v10-ct-hot',
    slug: 'v10-ct-hot',
    title: 'Vào 10 Hà Nội 2026 — đề thi nóng',
    year: '2026',
    category: 'vao-10',
    examType: 'chinh-thuc',
    views: 1200,
    _status: 'published',
    deReady: true,
    createdAt: '2026-06-10T00:00:00Z',
    tags: { hot: { enabled: true, expiresAt: futureDate } },
  },
  {
    id: 'v10-ct-new',
    slug: 'v10-ct-new',
    title: 'Vào 10 TP.HCM 2025 — mới cập nhật',
    year: '2025',
    category: 'vao-10',
    examType: 'chinh-thuc',
    views: 80,
    _status: 'published',
    deReady: true,
    createdAt: '2026-06-15T00:00:00Z',
  },
  // Draft — should NOT be counted
  {
    id: 'v10-ct-2027-draft',
    slug: 'v10-ct-2027-draft',
    title: 'Vào 10 2027 DRAFT',
    year: '2027',
    category: 'vao-10',
    examType: 'chinh-thuc',
    _status: 'draft',
    createdAt: '2027-06-01T00:00:00Z',
  },
  // vao-10 thi-thu: 1 HOT (views=500, hot.enabled, expiresAt future), 1 NEW (no hot tag)
  {
    id: 'v10-tt-hot',
    slug: 'v10-tt-hot',
    title: 'Thi thử HOT',
    year: '2026',
    category: 'vao-10',
    examType: 'thi-thu',
    views: 500,
    _status: 'published',
    deReady: true,
    createdAt: '2026-05-01T00:00:00Z',
    tags: { hot: { enabled: true, expiresAt: futureDate } },
  },
  {
    id: 'v10-tt-new',
    slug: 'v10-tt-new',
    title: 'Thi thử mới',
    year: '2026',
    category: 'vao-10',
    examType: 'thi-thu',
    views: 50,
    _status: 'published',
    deReady: true,
    createdAt: '2026-05-15T00:00:00Z',
  },
]

const makePayload = (exams: ExamFixture[] = makeExams()) => {
  const find = vi.fn(async (args: any) => {
    if (args.collection !== 'exams') return { docs: [], totalDocs: 0 }
    let rows = [...exams]
    const w = args.where || {}
    if (w._status?.equals) rows = rows.filter((e) => e._status === w._status.equals)
    if (w.category?.equals) rows = rows.filter((e) => e.category === w.category.equals)
    if (w.examType?.equals) rows = rows.filter((e) => e.examType === w.examType.equals)
    if (w['tags.hot.enabled']?.equals !== undefined) {
      rows = rows.filter(
        (e) => Boolean(e.tags?.hot?.enabled) === Boolean(w['tags.hot.enabled'].equals),
      )
    }
    if (w.deReady?.equals !== undefined) {
      rows = rows.filter((e) => Boolean(e.deReady) === Boolean(w.deReady.equals))
    }
    if (Array.isArray(w.slug?.not_in)) {
      const excl = new Set<string>(w.slug.not_in)
      rows = rows.filter((e) => !excl.has(e.slug))
    }
    const sort: string = args.sort || '-createdAt'
    if (sort === '-views') {
      rows.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    } else if (sort === '-createdAt') {
      rows.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    }
    const limit = args.limit ?? 20
    const docs = rows.slice(0, limit)
    return { docs, totalDocs: rows.length }
  })
  return { find, logger: { error: vi.fn() } }
}

const callEndpoint = async (payload: any) => {
  const handler = (megaMenuKhoDeEndpoint as any).handler
  const res = (await handler({ payload } as any)) as Response
  const body = await res.json()
  return { status: res.status ?? 200, body }
}

describe('mega-menu-kho-de endpoint', () => {
  beforeEach(() => {
    __resetMegaMenuCache()
  })

  it('returns top 3 latest years for vao-10 chinh-thuc, descending', async () => {
    const payload = makePayload()
    const { status, body } = await callEndpoint(payload)
    expect(status).toBe(200)
    const years = body.vao10.chinhThuc.years
    expect(years.map((y: any) => y.year)).toEqual(['2026', '2025', '2024'])
    // 2026 has 2 docs, 2025 has 1, 2024 has 1
    expect(years[0]).toEqual({ year: '2026', count: 3 })
    expect(years[1]).toEqual({ year: '2025', count: 2 })
    expect(years[2]).toEqual({ year: '2024', count: 1 })
  })

  it('returns hot+new with dedupe (hot slugs not in new array)', async () => {
    const payload = makePayload()
    const { body } = await callEndpoint(payload)
    const tt = body.vao10.thiThu
    expect(tt.hot).toHaveLength(1)
    expect(tt.hot[0]).toMatchObject({ slug: 'v10-tt-hot', isHot: true })
    // NEW must not include the hot slug
    expect(tt.new.map((e: any) => e.slug)).not.toContain('v10-tt-hot')
    expect(tt.new).toHaveLength(1)
    expect(tt.new[0]).toMatchObject({ slug: 'v10-tt-new', isHot: false })
  })

  it('returns chinhThuc.hot and chinhThuc.new for vao-10 (top 3 each), HOT not in NEW', async () => {
    const payload = makePayload()
    const { body } = await callEndpoint(payload)
    const ct = body.vao10.chinhThuc
    expect(Array.isArray(ct.hot)).toBe(true)
    expect(Array.isArray(ct.new)).toBe(true)
    expect(ct.hot.length).toBeLessThanOrEqual(3)
    expect(ct.new.length).toBeLessThanOrEqual(3)
    expect(ct.hot.map((e: any) => e.slug)).toContain('v10-ct-hot')
    expect(ct.hot[0]).toMatchObject({ slug: 'v10-ct-hot', isHot: true })
    expect(ct.new.map((e: any) => e.slug)).not.toContain('v10-ct-hot')
    expect(ct.new[0]?.slug).toBe('v10-ct-new')
  })

  it('chinhThuc.hot excludes waiting exams (deReady filter)', async () => {
    const exams: ExamFixture[] = [
      {
        id: 'ready-ct-hot',
        slug: 'ready-ct-hot',
        title: 'Ready CT Hot',
        year: '2026',
        category: 'vao-10',
        examType: 'chinh-thuc',
        views: 500,
        _status: 'published',
        deReady: true,
        createdAt: '2026-05-01T00:00:00Z',
        tags: { hot: { enabled: true, expiresAt: futureDate } },
      },
      {
        id: 'waiting-ct',
        slug: 'waiting-ct',
        title: 'Waiting CT',
        year: '2026',
        category: 'vao-10',
        examType: 'chinh-thuc',
        _status: 'published',
        deReady: false,
        createdAt: '2026-05-15T00:00:00Z',
      },
    ]
    const payload = makePayload(exams)
    const { body } = await callEndpoint(payload)
    expect(body.vao10.chinhThuc.hot.map((e: any) => e.slug)).toContain('ready-ct-hot')
    expect(body.vao10.chinhThuc.new.map((e: any) => e.slug)).not.toContain('waiting-ct')
  })

  it('chinhThuc fallback empty hot/new when payload.find throws', async () => {
    const payload = {
      find: vi.fn(async () => {
        throw new Error('mongo down')
      }),
      logger: { error: vi.fn() },
    }
    const { body } = await callEndpoint(payload)
    expect(body.vao10.chinhThuc.hot).toEqual([])
    expect(body.vao10.chinhThuc.new).toEqual([])
    expect(body.thptQg.chinhThuc.hot).toEqual([])
    expect(body.thptQg.chinhThuc.new).toEqual([])
  })

  it('returns empty arrays when category has no data (thpt-qg / vao-dai-hoc)', async () => {
    const payload = makePayload()
    const { body } = await callEndpoint(payload)
    expect(body.thptQg.chinhThuc.years).toEqual([])
    expect(body.thptQg.chinhThuc.hot).toEqual([])
    expect(body.thptQg.chinhThuc.new).toEqual([])
    expect(body.thptQg.thiThu.hot).toEqual([])
    expect(body.thptQg.thiThu.new).toEqual([])
    expect(body.thptQg.minhHoa.hot).toEqual([])
    expect(body.thptQg.minhHoa.new).toEqual([])
  })

  it('returns 200 with empty fallback when payload.find throws', async () => {
    const payload = {
      find: vi.fn(async () => {
        throw new Error('mongo down')
      }),
      logger: { error: vi.fn() },
    }
    const { status, body } = await callEndpoint(payload)
    expect(status).toBe(200)
    expect(body.vao10).toEqual({
      chinhThuc: { years: [], hot: [], new: [] },
      thiThu: { hot: [], new: [] },
      minhHoa: { hot: [], new: [] },
    })
    expect(body.thptQg).toEqual({
      chinhThuc: { years: [], hot: [], new: [] },
      thiThu: { hot: [], new: [] },
      minhHoa: { hot: [], new: [] },
    })
  })

  it('caches response: second call within 60s does not invoke payload.find again', async () => {
    const payload = makePayload()
    await callEndpoint(payload)
    const callsAfterFirst = (payload.find as any).mock.calls.length
    expect(callsAfterFirst).toBeGreaterThan(0)
    await callEndpoint(payload)
    const callsAfterSecond = (payload.find as any).mock.calls.length
    expect(callsAfterSecond).toBe(callsAfterFirst)
  })

  it('latest-years includes waiting exams (no deReady filter)', async () => {
    const exams: ExamFixture[] = [
      {
        id: 'ready-2026',
        slug: 'ready-2026',
        title: 'Ready 2026',
        year: '2026',
        category: 'vao-10',
        examType: 'chinh-thuc',
        _status: 'published',
        deReady: true,
        createdAt: '2026-06-01T00:00:00Z',
      },
      {
        id: 'waiting-2025',
        slug: 'waiting-2025',
        title: 'Waiting 2025',
        year: '2025',
        category: 'vao-10',
        examType: 'chinh-thuc',
        _status: 'published',
        deReady: false,
        createdAt: '2025-06-01T00:00:00Z',
      },
    ]
    const payload = makePayload(exams)
    const { body } = await callEndpoint(payload)
    const years = body.vao10.chinhThuc.years.map((y: any) => y.year)
    expect(years).toContain('2026')
    expect(years).toContain('2025')
  })

  it('hot-new-mix excludes waiting exams (deReady filter)', async () => {
    const exams: ExamFixture[] = [
      {
        id: 'ready-hot',
        slug: 'ready-hot',
        title: 'Ready Hot',
        year: '2026',
        category: 'vao-10',
        examType: 'thi-thu',
        views: 500,
        _status: 'published',
        deReady: true,
        createdAt: '2026-05-01T00:00:00Z',
        tags: { hot: { enabled: true, expiresAt: futureDate } },
      },
      {
        id: 'waiting-tt',
        slug: 'waiting-tt',
        title: 'Waiting TT',
        year: '2026',
        category: 'vao-10',
        examType: 'thi-thu',
        _status: 'published',
        deReady: false,
        createdAt: '2026-05-15T00:00:00Z',
      },
    ]
    const payload = makePayload(exams)
    const { body } = await callEndpoint(payload)
    const hotSlugs = body.vao10.thiThu.hot.map((e: any) => e.slug)
    const newSlugs = body.vao10.thiThu.new.map((e: any) => e.slug)
    expect(hotSlugs).toContain('ready-hot')
    expect(newSlugs).not.toContain('waiting-tt')
  })

  it('filters out expired hot exams', async () => {
    const exams: ExamFixture[] = [
      {
        id: 'expired-hot',
        slug: 'expired-hot',
        title: 'Hot đã hết hạn',
        year: '2026',
        category: 'vao-10',
        examType: 'thi-thu',
        views: 999,
        _status: 'published',
        deReady: true,
        createdAt: '2026-05-01T00:00:00Z',
        tags: { hot: { enabled: true, expiresAt: pastDate } },
      },
    ]
    const payload = makePayload(exams)
    const { body } = await callEndpoint(payload)
    expect(body.vao10.thiThu.hot).toHaveLength(0)
  })
})
