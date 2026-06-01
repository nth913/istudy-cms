// istudy-cms/src/endpoints/search.ts
import type { Endpoint, PayloadRequest } from 'payload'
import {
  examToResult,
  queryIndex,
  type CatId,
  type SearchBuckets,
} from '../lib/search-index'
import { CAT_SOURCES, buildCatWhere } from '../lib/search-collections'
import { computePopularTags, computeTopProvinces } from './search-meta-helpers'

const MAX_QUERY_LEN = 100
const MAX_LIMIT = 20
const DEFAULT_LIMIT = 8

const CATS: CatId[] = ['thpt', 'l10', 'hsa', 'blog']

async function regexFallback(req: PayloadRequest, q: string, limit: number): Promise<SearchBuckets> {
  const res = await Promise.all(CATS.map((c) =>
    req.payload.find({ collection: CAT_SOURCES[c].collection, where: buildCatWhere(c, { q }), limit, depth: 1 }),
  ))
  const buckets: SearchBuckets = { thpt: [], l10: [], hsa: [], blog: [], order: ['thpt', 'l10', 'hsa', 'blog'], total: 0 }
  CATS.forEach((c, i) => { (buckets as any)[c] = res[i].docs.map(CAT_SOURCES[c].toResult) })
  buckets.total = CATS.reduce((n, c) => n + (buckets as any)[c].length, 0)
  return buckets
}

async function computeCounts(req: PayloadRequest, q: string): Promise<Record<CatId, number>> {
  const res = await Promise.all(CATS.map((c) =>
    req.payload.count({ collection: CAT_SOURCES[c].collection, where: buildCatWhere(c, { q }) }),
  ))
  return { thpt: res[0].totalDocs, l10: res[1].totalDocs, hsa: res[2].totalDocs, blog: res[3].totalDocs }
}

export const searchEndpoint: Endpoint = {
  path: '/search',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const url = new URL(req.url || '/', 'http://localhost')
    const q = url.searchParams.get('q')?.trim()
    if (!q) {
      return Response.json({ error: 'Thiếu tham số q' }, { status: 400 })
    }
    if (q.length > MAX_QUERY_LEN) {
      return Response.json({ error: 'Truy vấn quá dài' }, { status: 400 })
    }
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT))
    const start = Date.now()

    let buckets: SearchBuckets
    try {
      buckets = await queryIndex(req.payload, q, limit)
    } catch (err) {
      req.payload?.logger?.error?.({ err }, 'search index failed; falling back to regex')
      buckets = await regexFallback(req, q, limit)
    }

    const counts = await computeCounts(req, q)
    return Response.json({ ...buckets, counts, tookMs: Date.now() - start })
  },
}

export const searchMetaEndpoint: Endpoint = {
  path: '/search/meta',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const cfg = await req.payload.findGlobal({ slug: 'search-config' })
    const maxTags = Number((cfg as any)?.maxTagsSuggest) || 3
    const maxProv = Number((cfg as any)?.maxProvincesSuggest) || 3
    const [popularTags, provinces] = await Promise.all([
      computePopularTags(req.payload, maxTags),
      computeTopProvinces(req.payload, maxProv),
    ])
    const trending = ((cfg as any)?.trendingItems ?? []).map((t: any, i: number) => ({
      rank: i + 1,
      label: t.label,
      delta: t.delta || null,
    }))

    const hotRes = await req.payload.find({
      collection: 'exams',
      where: { _status: { equals: 'published' }, 'tags.hot.enabled': { equals: true } },
      sort: '-views',
      limit: 1,
      depth: 1,
    })
    let featDoc = hotRes.docs[0]
    if (!featDoc) {
      const topRes = await req.payload.find({
        collection: 'exams',
        where: { _status: { equals: 'published' } },
        sort: '-views',
        limit: 1,
        depth: 1,
      })
      featDoc = topRes.docs[0]
    }

    let featured: any = null
    if (featDoc) {
      const r = examToResult(featDoc)
      featured = {
        id: r.id,
        cat: r.cat,
        href: r.href,
        title: r.title,
        thumbLines: [r.cat === 'l10' ? 'Vào 10' : 'THPT', (featDoc as any).year || ''],
        metaText: r.meta.slice(0, 2).join(' · '),
      }
    }

    return new Response(
      JSON.stringify({ trending, popularTags, provinces, featured }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      },
    )
  },
}
