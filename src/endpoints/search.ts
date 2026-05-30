// istudy-cms/src/endpoints/search.ts
import type { Endpoint, PayloadRequest } from 'payload'
import { removeVietnameseDiacritics } from '../lib/vietnamese-slugify'
import { formatVN, minutesRead } from '../lib/search-helpers'

type CatId = 'thpt' | 'l10' | 'hsa' | 'blog'
interface SearchResult {
  id: string
  cat: CatId
  href: string
  title: string
  meta: string[]
}

const EXAM_TYPE_LABEL: Record<string, string> = {
  'chinh-thuc': 'Đề chính thức',
  'thi-thu': 'Đề thi thử',
  'minh-hoa': 'Đề minh hoạ',
}

const POST_CAT_LABEL: Record<string, string> = {
  'tu-vung': 'Từ vựng',
  'ngu-phap': 'Ngữ pháp',
  'meo': 'Mẹo',
  'tin-tuc': 'Tin tức',
}

function examToResult(doc: any): SearchResult {
  const cat: CatId = doc.category === 'vao-10' ? 'l10' : 'thpt'
  const meta = [
    EXAM_TYPE_LABEL[doc.examType] || null,
    doc.year ? `Năm ${doc.year}` : null,
    doc.province?.name || doc.school || null,
    doc.dapAnReady ? 'Có đáp án' : null,
  ].filter(Boolean) as string[]
  return {
    id: String(doc.id),
    cat,
    href: `/de-thi-chi-tiet/${doc.slug}`,
    title: doc.title,
    meta,
  }
}

function eventToResult(doc: any): SearchResult {
  const meta = [
    'HSA · ĐGNL',
    formatVN(doc.startAt) ? `Đợt ${formatVN(doc.startAt)}` : null,
    doc.registeredCount ? `${doc.registeredCount} đăng ký` : null,
  ].filter(Boolean) as string[]
  return {
    id: String(doc.id),
    cat: 'hsa',
    href: `/kho-de-thi?event=${doc.slug}`,
    title: doc.title,
    meta,
  }
}

function postToResult(doc: any): SearchResult {
  const meta = [
    POST_CAT_LABEL[doc.category] || null,
    doc.author?.name || null,
    doc.publishedAt ? `${minutesRead(doc.body)} phút đọc` : null,
  ].filter(Boolean) as string[]
  return {
    id: String(doc.id),
    cat: 'blog',
    href: `/bai-viet-chi-tiet/${doc.slug}`,
    title: doc.title,
    meta,
  }
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
    if (q.length > 100) {
      return Response.json({ error: 'Truy vấn quá dài' }, { status: 400 })
    }
    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') ?? 8) || 8))
    const qNorm = removeVietnameseDiacritics(q).toLowerCase()
    const start = Date.now()

    const [thptRes, l10Res, hsaRes, blogRes] = await Promise.all([
      req.payload.find({
        collection: 'exams',
        where: { _status: { equals: 'published' }, category: { equals: 'vao-dai-hoc' }, searchKey: { contains: qNorm } },
        limit,
        depth: 1,
      }),
      req.payload.find({
        collection: 'exams',
        where: { _status: { equals: 'published' }, category: { equals: 'vao-10' }, searchKey: { contains: qNorm } },
        limit,
        depth: 1,
      }),
      req.payload.find({
        collection: 'events',
        where: { _status: { equals: 'published' }, submenu: { in: ['dgnl', 'dgnl-thu'] }, searchKeyEvent: { contains: qNorm } },
        limit,
        depth: 1,
      }),
      req.payload.find({
        collection: 'posts',
        where: { _status: { equals: 'published' }, searchKeyPost: { contains: qNorm } },
        limit,
        depth: 1,
      }),
    ])

    const thpt = thptRes.docs.map(examToResult).filter((r) => r.cat === 'thpt')
    const l10 = l10Res.docs.map(examToResult).filter((r) => r.cat === 'l10')
    const hsa = hsaRes.docs.map(eventToResult)
    const blog = blogRes.docs.map(postToResult)
    const total = thpt.length + l10.length + hsa.length + blog.length

    return Response.json({
      thpt, l10, hsa, blog, total, tookMs: Date.now() - start,
    })
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
