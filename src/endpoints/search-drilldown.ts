import type { Endpoint, PayloadRequest } from 'payload'
import { CAT_SOURCES, buildCatWhere } from '../lib/search-collections'
import type { CatId } from '../lib/search-index'

const YEAR_RE = /^20[2-9]\d$/
const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020']

export const searchDrilldownEndpoint: Endpoint = {
  path: '/search-drilldown',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const p = new URL(req.url || '/', 'http://localhost').searchParams
    const cat = p.get('cat') as CatId | null
    if (!cat || !CAT_SOURCES[cat]) {
      return Response.json({ error: 'Tham số cat không hợp lệ' }, { status: 400 })
    }
    const src = CAT_SOURCES[cat]
    const q = p.get('q')?.trim() || undefined
    const year = p.get('year') || undefined
    if (year && !YEAR_RE.test(year)) {
      return Response.json({ error: 'Tham số year không hợp lệ' }, { status: 400 })
    }
    const hasAnswer = p.get('hasAnswer') === 'true'
    const sortDir = p.get('sort') === 'oldest' ? 'oldest' : 'newest'
    const limit = Math.min(50, Math.max(1, Number(p.get('limit') ?? 20) || 20))
    const offset = Math.max(0, Number(p.get('offset') ?? 0) || 0)

    const where = buildCatWhere(cat, { q, year: src.supportsYear ? year : undefined, hasAnswer })
    const sort = (sortDir === 'oldest' ? '' : '-') + src.sortField
    const result = await req.payload.find({
      collection: src.collection, where, sort, limit, page: Math.floor(offset / limit) + 1, depth: 1,
    })
    const items = result.docs.map(src.toResult)

    let facets: { years: { year: string; count: number }[] } | undefined
    if (p.get('facets') === 'year' && src.supportsYear) {
      const counts = await Promise.all(YEARS.map((y) =>
        req.payload.count({ collection: src.collection, where: buildCatWhere(cat, { q, year: y }) }),
      ))
      facets = { years: YEARS.map((y, i) => ({ year: y, count: counts[i].totalDocs })).filter((x) => x.count > 0) }
    }

    return Response.json({ items, total: result.totalDocs, hasMore: result.hasNextPage, ...(facets ? { facets } : {}) })
  },
}
