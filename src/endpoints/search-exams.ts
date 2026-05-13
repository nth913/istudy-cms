import type { Endpoint, PayloadRequest } from 'payload'
import { removeVietnameseDiacritics } from '../lib/vietnamese-slugify'

const MOI_THRESHOLD_DAYS = Number(process.env.MOI_THRESHOLD_DAYS) || 30

type SearchBody = {
  q?: string
  category: 'vao-10' | 'vao-dai-hoc'
  examType?: 'chinh-thuc' | 'thi-thu' | 'minh-hoa'
  year?: string
  schoolMatch?: string
  provinceSlug?: string
  tags?: ('hot' | 'hay' | 'moi')[]
  sort?: 'relevance' | 'newest' | 'year-desc'
  page?: number
  limit?: number
}

export const searchExamsEndpoint: Endpoint = {
  path: '/exams/search',
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
