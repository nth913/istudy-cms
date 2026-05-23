import type { Endpoint, PayloadRequest } from 'payload'
import { removeVietnameseDiacritics } from '../lib/vietnamese-slugify'

const MOI_THRESHOLD_DAYS = Number(process.env.MOI_THRESHOLD_DAYS) || 30

// ---------- Extended GET endpoint shared constants ----------

const YEAR_RE = /^20[2-9][0-9]$/
const EXAM_TYPES = ['chinh-thuc', 'thi-thu', 'minh-hoa'] as const
type ExamType = typeof EXAM_TYPES[number]
const SORT_MAP: Record<string, string> = {
  latest: '-createdAt',
  popular: '-viewsThisWeek',
  views: '-views',
}

type SearchBody = {
  q?: string
  category: 'vao-10' | 'vao-dai-hoc'
  examType?: ExamType
  year?: string
  schoolMatch?: string
  provinceSlug?: string
  tags?: ('hot' | 'hay' | 'moi')[]
  sort?: 'relevance' | 'newest' | 'year-desc'
  page?: number
  limit?: number
}

export const searchExamsEndpoint: Endpoint = {
  // Mounted on the `exams` collection — resolved as /api/exams/search.
  // Payload routes top-level endpoints under collection slugs through
  // `collection.config.endpoints`, so this must live on the Exams collection.
  path: '/search',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const body = (await req.json?.()) as SearchBody
    if (!body?.category) {
      return Response.json({ error: 'category required' }, { status: 400 })
    }

    const page = Math.max(1, body.page ?? 1)
    const limit = Math.min(50, Math.max(1, body.limit ?? 20))
    const now = new Date()
    const moiThreshold = new Date(now.getTime() - MOI_THRESHOLD_DAYS * 86400_000)

    const where: any = {
      _status: { equals: 'published' },
      category: { equals: body.category },
    }
    if (body.examType) where.examType = { equals: body.examType }
    if (body.year) where.year = { equals: body.year }
    if (body.provinceSlug) {
      const provinces = await req.payload.find({
        collection: 'provinces',
        where: { slug: { equals: body.provinceSlug } },
        limit: 1,
      })
      const provinceId = provinces.docs[0]?.id
      if (provinceId) where.province = { equals: provinceId }
      else where.province = { equals: '__no_match__' }
    }
    if (body.q) {
      const q = removeVietnameseDiacritics(body.q).toLowerCase()
      where.searchKey = { contains: q }
    }
    if (body.schoolMatch) {
      where.school = { like: body.schoolMatch }
    }

    const result = await req.payload.find({
      collection: 'exams',
      where,
      page,
      limit: body.tags?.length ? limit * 3 : limit,
      sort: body.sort === 'year-desc' ? '-year' : '-createdAt',
    })

    let docs: any[] = result.docs
    if (body.tags?.length) {
      docs = docs.filter((d: any) => {
        const isHot = d.tags?.hot?.enabled &&
          (!d.tags.hot.expiresAt || new Date(d.tags.hot.expiresAt) > now)
        const isHay = d.tags?.hay === true
        const isMoi = d.publishedAt && new Date(d.publishedAt) > moiThreshold
        return body.tags!.every(t =>
          (t === 'hot' && isHot) ||
          (t === 'hay' && isHay) ||
          (t === 'moi' && isMoi)
        )
      })
      docs = docs.slice(0, limit)
    }

    return Response.json({
      docs,
      totalDocs: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  },
}

// ---------- GET /api/search-exams (extended: filter + sort + pagination) ----------
// Mounted as a top-level endpoint (root path `/search-exams`) so the URL resolves
// to `/api/search-exams`. Consumed by istudy-web `lib/api/exams.ts` fetcher.
export const searchExamsGetEndpoint: Endpoint = {
  path: '/search-exams',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const url = new URL(req.url || '/', 'http://localhost')
    const q = url.searchParams

    const cat = q.get('cat') || q.get('category') || undefined
    const provinceSlug = q.get('province') || undefined
    const year = q.get('year') || undefined
    const examType = q.get('examType') || undefined
    const yearMax = q.get('yearMax') || undefined
    const deReadyParam = q.get('deReady')
    const sortKey = q.get('sort') || 'latest'

    const rawLimit = Number(q.get('limit') ?? 20)
    const limit = Math.min(50, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 20))
    const rawOffset = Number(q.get('offset') ?? 0)
    const offset = Math.max(0, Number.isFinite(rawOffset) ? rawOffset : 0)

    if (year && !YEAR_RE.test(year)) {
      return Response.json({ error: 'Tham số year không hợp lệ' }, { status: 400 })
    }
    if (yearMax && !YEAR_RE.test(yearMax)) {
      return Response.json({ error: 'Tham số yearMax không hợp lệ' }, { status: 400 })
    }
    if (year && yearMax) {
      return Response.json(
        { error: 'Không thể dùng đồng thời year và yearMax' },
        { status: 400 },
      )
    }
    if (examType && !(EXAM_TYPES as readonly string[]).includes(examType)) {
      return Response.json({ error: 'Tham số examType không hợp lệ' }, { status: 400 })
    }

    // List includes both draft + published — public ACL allows read for waiting
    // state UI. pdfFile + answerFile fields hidden when draft (field-level ACL).
    const where: any = {}
    if (cat) where.category = { equals: cat }
    if (year) where.year = { equals: year }
    if (examType) where.examType = { equals: examType }
    if (yearMax) where.year = { ...(where.year || {}), less_than_equal: yearMax }

    if (provinceSlug) {
      const provRes = await req.payload.find({
        collection: 'provinces',
        where: { slug: { equals: provinceSlug } },
        limit: 1,
      })
      const provId = provRes.docs[0]?.id
      if (provId) {
        where.province = { equals: provId }
      }
      // province slug not found → silent no-filter (per spec)
    }

    // deReady filter: true → ready only, false → waiting only, undefined → no filter
    if (deReadyParam === 'true') {
      where.deReady = { equals: true }
    } else if (deReadyParam === 'false') {
      where.deReady = { equals: false }
    }

    const sort = SORT_MAP[sortKey] || SORT_MAP.latest

    const result = await req.payload.find({
      collection: 'exams',
      where,
      sort,
      limit,
      page: Math.floor(offset / limit) + 1,
      depth: 1,
    })

    return Response.json({
      items: result.docs,
      total: result.totalDocs,
      limit,
      offset,
    })
  },
}
