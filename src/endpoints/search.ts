// istudy-cms/src/endpoints/search.ts
import type { Endpoint, PayloadRequest } from 'payload'
import { removeVietnameseDiacritics } from '../lib/vietnamese-slugify'
import {
  examToResult,
  eventToResult,
  postToResult,
  queryIndex,
  type SearchBuckets,
} from '../lib/search-index'

const MAX_QUERY_LEN = 100
const MAX_LIMIT = 20
const DEFAULT_LIMIT = 8

async function regexFallback(req: PayloadRequest, qNorm: string, limit: number): Promise<SearchBuckets> {
  const [thptRes, l10Res, hsaRes, blogRes] = await Promise.all([
    req.payload.find({ collection: 'exams', where: { _status: { equals: 'published' }, category: { equals: 'vao-dai-hoc' }, searchKey: { contains: qNorm } }, limit, depth: 1 }),
    req.payload.find({ collection: 'exams', where: { _status: { equals: 'published' }, category: { equals: 'vao-10' }, searchKey: { contains: qNorm } }, limit, depth: 1 }),
    req.payload.find({ collection: 'events', where: { _status: { equals: 'published' }, submenu: { in: ['dgnl', 'dgnl-thu'] }, searchKeyEvent: { contains: qNorm } }, limit, depth: 1 }),
    req.payload.find({ collection: 'posts', where: { _status: { equals: 'published' }, searchKeyPost: { contains: qNorm } }, limit, depth: 1 }),
  ])
  // Guard: keep only the queried category (redundant in prod; test mock ignores where).
  const thpt = thptRes.docs.map(examToResult).filter((r) => r.cat === 'thpt')
  const l10 = l10Res.docs.map(examToResult).filter((r) => r.cat === 'l10')
  const hsa = hsaRes.docs.map(eventToResult)
  const blog = blogRes.docs.map(postToResult)
  return { thpt, l10, hsa, blog, order: ['thpt', 'l10', 'hsa', 'blog'], total: thpt.length + l10.length + hsa.length + blog.length }
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
      const qNorm = removeVietnameseDiacritics(q).toLowerCase()
      buckets = await regexFallback(req, qNorm, limit)
    }

    return Response.json({ ...buckets, tookMs: Date.now() - start })
  },
}

export const searchMetaEndpoint: Endpoint = {
  path: '/search/meta',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const cfg = await req.payload.findGlobal({ slug: 'search-config' })
    const popularTags = (cfg as any)?.popularTags?.map((t: any) => ({ id: t.id, label: t.label, hot: !!t.hot })) ?? []
    const provinces = (cfg as any)?.provinces?.map((p: any) => p.name) ?? []
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
