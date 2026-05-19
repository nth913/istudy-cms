import type { CollectionSlug, Endpoint, PayloadRequest, Where } from 'payload'
import { vietnameseSlugify } from '../lib/vietnamese-slugify'

const EXAMS = 'exams' as CollectionSlug
const PROVINCES = 'provinces' as CollectionSlug
const SUBJECTS = 'subjects' as CollectionSlug

const EXAM_SELECT = {
  title: true,
  slug: true,
  category: true,
  examType: true,
  year: true,
  school: true,
  province: true,
  updatedAt: true,
} as const

function parsePagination(url: URL) {
  const pageParam = Number(url.searchParams.get('page') || '1')
  const limitParam = Number(url.searchParams.get('limit') || '20')
  return {
    page: Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1,
    limit: Math.min(50, Math.max(1, Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 20)),
  }
}

async function findExamsByWhere(req: PayloadRequest, where: Where, page: number, limit: number, hub: Record<string, unknown>) {
  const result = await req.payload.find({
    collection: EXAMS,
    where: { and: [{ _status: { equals: 'published' } }, where] },
    page,
    limit,
    sort: '-updatedAt',
    depth: 1,
    select: EXAM_SELECT,
  })
  return Response.json({
    hub,
    items: result.docs,
    page: result.page,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
  })
}

export const provinceHubEndpoint: Endpoint = {
  path: '/by-slug/:slug/exams',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const slug = req.routeParams?.slug as string | undefined
    if (!slug) return Response.json({ error: 'Slug bắt buộc' }, { status: 400 })
    const url = new URL(req.url || '', 'http://localhost')
    const { page, limit } = parsePagination(url)

    const provinceResult = await req.payload.find({
      collection: PROVINCES,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const province = provinceResult.docs[0] as { id: string | number; name?: string } | undefined
    if (!province) return Response.json({ error: 'Không tìm thấy tỉnh' }, { status: 404 })

    return findExamsByWhere(req, { province: { equals: province.id } }, page, limit, {
      type: 'province',
      slug,
      name: province.name,
      id: province.id,
    })
  },
}

export const schoolHubEndpoint: Endpoint = {
  path: '/by-slug/:slug/exams',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const slug = req.routeParams?.slug as string | undefined
    if (!slug) return Response.json({ error: 'Slug bắt buộc' }, { status: 400 })
    const url = new URL(req.url || '', 'http://localhost')
    const { page, limit } = parsePagination(url)

    // school is a free-text field. Match by slugified value via collection scan + filter.
    // For perf, defer to a denorm schoolSlug field when collection grows large.
    const sample = await req.payload.find({
      collection: EXAMS,
      where: { and: [{ _status: { equals: 'published' } }, { school: { exists: true } }] },
      limit: 1000,
      depth: 0,
      select: { id: true, school: true },
    })
    const matchIds = sample.docs
      .filter((d) => typeof (d as { school?: string }).school === 'string' && vietnameseSlugify((d as { school: string }).school) === slug)
      .map((d) => d.id)

    if (matchIds.length === 0) {
      return Response.json({ hub: { type: 'school', slug, name: slug }, items: [], page: 1, totalPages: 0, totalDocs: 0 })
    }

    return findExamsByWhere(req, { id: { in: matchIds } }, page, limit, { type: 'school', slug, name: slug })
  },
}

export const subjectHubEndpoint: Endpoint = {
  path: '/by-slug/:slug/exams',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const slug = req.routeParams?.slug as string | undefined
    if (!slug) return Response.json({ error: 'Slug bắt buộc' }, { status: 400 })
    const url = new URL(req.url || '', 'http://localhost')
    const { page, limit } = parsePagination(url)

    const subjectResult = await req.payload.find({
      collection: SUBJECTS,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const subject = subjectResult.docs[0] as { id: string | number; name?: string } | undefined
    if (!subject) {
      return Response.json({ hub: { type: 'subject', slug, name: slug }, items: [], page: 1, totalPages: 0, totalDocs: 0 })
    }

    // Exams collection currently has no subject relation. Return empty until MB4+ adds it.
    return Response.json({
      hub: { type: 'subject', slug, name: subject.name, id: subject.id },
      items: [],
      page: 1,
      totalPages: 0,
      totalDocs: 0,
      note: 'Subject relation chưa add vào Exams (MB4 sẽ wire)',
    })
  },
}

export const yearHubEndpoint: Endpoint = {
  path: '/by-year/:year/exams',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const year = req.routeParams?.year as string | undefined
    if (!year || !/^\d{4}$/.test(year)) {
      return Response.json({ error: 'Năm không hợp lệ' }, { status: 400 })
    }
    const url = new URL(req.url || '', 'http://localhost')
    const { page, limit } = parsePagination(url)

    return findExamsByWhere(req, { year: { equals: year } }, page, limit, {
      type: 'year',
      year,
      name: `Năm ${year}`,
    })
  },
}
