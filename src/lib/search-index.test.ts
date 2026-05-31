import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSearchIndex, queryIndex, markSearchDirty, examToResult } from './search-index'

function mockPayload(finders: Record<string, any[]>) {
  return {
    find: vi.fn(async ({ collection }: any) => ({
      docs: finders[collection] ?? [],
      totalDocs: (finders[collection] ?? []).length,
    })),
  } as any
}

const EXAMS = [
  { id: 'e1', title: 'Đề tham khảo THPT 2025', slug: 'de-tham-khao-thpt-2025', category: 'vao-dai-hoc', examType: 'chinh-thuc', year: '2025', dapAnReady: true, searchKey: 'de tham khao thpt 2025' },
  { id: 'e2', title: 'Đề vào 10 Hà Nội 2024', slug: 'de-vao-10-hn-2024', category: 'vao-10', examType: 'thi-thu', year: '2024', searchKey: 'de vao 10 ha noi 2024' },
]
const EVENTS = [
  { id: 'v1', title: 'HSA Đợt 1 2026', slug: 'hsa-dot-1-2026', submenu: 'dgnl', startAt: '2026-06-27T00:00:00.000Z', searchKeyEvent: 'hsa dot 1 2026' },
]
const POSTS = [
  { id: 'p1', title: 'Mẹo đọc hiểu', slug: 'meo-doc-hieu', category: 'meo', publishedAt: '2026-05-01', body: { root: { children: [] } }, searchKeyPost: 'meo doc hieu tham khao' },
]

beforeEach(() => { markSearchDirty() })

describe('examToResult', () => {
  it('maps category to cat + builds href', () => {
    expect(examToResult(EXAMS[0]).cat).toBe('thpt')
    expect(examToResult(EXAMS[1]).cat).toBe('l10')
    expect(examToResult(EXAMS[0]).href).toBe('/de-thi-chi-tiet/de-tham-khao-thpt-2025')
  })
})

describe('buildSearchIndex', () => {
  it('queries 3 collections published + builds searchable index', async () => {
    const payload = mockPayload({ exams: EXAMS, events: EVENTS, posts: POSTS })
    const idx = await buildSearchIndex(payload)
    expect(idx.documentCount).toBe(4)
    expect(payload.find).toHaveBeenCalledTimes(3)
  })
})

describe('queryIndex', () => {
  it('ranks title match high + buckets by cat', async () => {
    const payload = mockPayload({ exams: EXAMS, events: EVENTS, posts: POSTS })
    const res = await queryIndex(payload, 'tham khao', 8)
    expect(res.thpt[0].title).toBe('Đề tham khảo THPT 2025')
    expect(res.total).toBeGreaterThanOrEqual(1)
  })

  it('fuzzy: tolerates a typo', async () => {
    const payload = mockPayload({ exams: EXAMS, events: EVENTS, posts: POSTS })
    const res = await queryIndex(payload, 'tham khzo', 8)
    expect(res.total).toBeGreaterThanOrEqual(1)
  })

  it('multi-word: matches docs containing all tokens (AND first)', async () => {
    const payload = mockPayload({ exams: EXAMS, events: EVENTS, posts: POSTS })
    const res = await queryIndex(payload, 'de 2025', 8)
    expect(res.thpt.map((r) => r.title)).toContain('Đề tham khảo THPT 2025')
  })

  it('clamps per-cat results to limit', async () => {
    const manyExams = Array.from({ length: 10 }, (_, i) => ({
      id: `x${i}`, title: `Đề tham khảo ${i}`, slug: `de-${i}`, category: 'vao-dai-hoc', year: '2025', searchKey: `de tham khao ${i}`,
    }))
    const payload = mockPayload({ exams: manyExams, events: [], posts: [] })
    const res = await queryIndex(payload, 'tham khao', 3)
    expect(res.thpt.length).toBeLessThanOrEqual(3)
  })

  it('returns empty buckets when no docs', async () => {
    const payload = mockPayload({ exams: [], events: [], posts: [] })
    const res = await queryIndex(payload, 'gibberish', 8)
    expect(res.total).toBe(0)
    expect(res.thpt).toEqual([])
  })

  it('order: section có match mạnh nhất (max score) đứng đầu, KHÔNG theo canonical', async () => {
    // Post khớp cả 3 token ở title (boost 3) → score cao. Exam chỉ khớp "cau" ở searchText (boost 1) → score thấp.
    const exams = [
      { id: 'e1', title: 'Đề THPT 2025', slug: 'de-thpt-2025', category: 'vao-dai-hoc', examType: 'chinh-thuc', year: '2025', searchKey: 'cau hoi de thpt 2025' },
    ]
    const posts = [
      { id: 'p1', title: 'Câu điều kiện nâng cao', slug: 'cau-dieu-kien', category: 'ngu-phap', publishedAt: '2026-05-01', body: { root: { children: [] } }, searchKeyPost: 'cau dieu kien nang cao' },
    ]
    const payload = mockPayload({ exams, events: [], posts })
    const res = await queryIndex(payload, 'cau dieu kien', 8)
    expect(res.order[0]).toBe('blog')        // canonical sẽ để blog cuối → chứng minh đã reorder
    expect(res.order).toHaveLength(4)
    expect(new Set(res.order).size).toBe(4)  // đủ 4 cat distinct
  })

  it('order: tất cả không match (tie ở 0) → giữ canonical thpt→l10→hsa→blog', async () => {
    const payload = mockPayload({ exams: EXAMS, events: EVENTS, posts: POSTS })
    const res = await queryIndex(payload, 'zzzkhongtontai', 8)
    expect(res.order).toEqual(['thpt', 'l10', 'hsa', 'blog'])
  })
})

describe('markSearchDirty', () => {
  it('forces rebuild on next query (picks up new data)', async () => {
    const payload = mockPayload({ exams: [EXAMS[0]], events: [], posts: [] })
    await queryIndex(payload, 'tham khao', 8)
    const callsBefore = payload.find.mock.calls.length
    markSearchDirty()
    await queryIndex(payload, 'tham khao', 8)
    expect(payload.find.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('race: markSearchDirty during in-flight build is not lost → next query rebuilds', async () => {
    // The mock's first `find` call (for exams) also fires markSearchDirty() to simulate
    // an invalidation arriving mid-build. After the first queryIndex completes the state
    // must still be dirty, causing the second queryIndex to trigger another build.
    let firstCall = true
    const basePayload = mockPayload({ exams: [EXAMS[0]], events: [], posts: [] })
    const racingPayload = {
      ...basePayload,
      find: vi.fn(async (args: any) => {
        if (firstCall) {
          firstCall = false
          // Simulate an invalidation arriving while the build is in flight.
          markSearchDirty()
        }
        return basePayload.find(args)
      }),
    } as any

    // First query — build starts; markSearchDirty fires mid-build; dirty flag should survive.
    await queryIndex(racingPayload, 'tham khao', 8)
    const callsAfterFirst = racingPayload.find.mock.calls.length

    // Second query — because dirty was re-set during the build, another rebuild must happen.
    await queryIndex(racingPayload, 'tham khao', 8)
    expect(racingPayload.find.mock.calls.length).toBeGreaterThan(callsAfterFirst)
  })
})
