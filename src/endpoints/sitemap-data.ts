import type { CollectionSlug, Endpoint, PayloadRequest } from 'payload'

const EXAMS = 'exams' as CollectionSlug
const POSTS = 'posts' as CollectionSlug
const BOOKS = 'books' as CollectionSlug
const PROVINCES = 'provinces' as CollectionSlug
const SUBJECTS = 'subjects' as CollectionSlug

const STATIC_YEARS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026']

const STATIC_URLS: Array<{ loc: string; priority?: number }> = [
  { loc: '/', priority: 1.0 },
  { loc: '/kho-de-thi', priority: 0.9 },
  { loc: '/bai-viet', priority: 0.8 },
  { loc: '/sach', priority: 0.7 },
  { loc: '/cho-de', priority: 0.6 },
]

export const sitemapDataEndpoint: Endpoint = {
  path: '/v1/sitemap-data',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const base = (process.env.FE_URL || 'https://aistudy.com.vn').replace(/\/$/, '')

    const [exams, posts, books, provinces, subjects] = await Promise.all([
      req.payload.find({
        collection: EXAMS,
        where: { _status: { equals: 'published' } },
        limit: 5000,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
      req.payload.find({
        collection: POSTS,
        where: { _status: { equals: 'published' } },
        limit: 5000,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
      req.payload.find({
        collection: BOOKS,
        where: { _status: { equals: 'published' } },
        limit: 5000,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
      req.payload.find({
        collection: PROVINCES,
        limit: 100,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
      req.payload.find({
        collection: SUBJECTS,
        limit: 100,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
    ])

    const urls: Array<{ loc: string; lastmod?: string; priority?: number }> = []

    for (const u of STATIC_URLS) urls.push({ loc: `${base}${u.loc}`, priority: u.priority })

    for (const exam of exams.docs as Array<{ slug?: string; updatedAt?: string }>) {
      if (exam.slug) urls.push({ loc: `${base}/de-thi-chi-tiet/${exam.slug}`, lastmod: exam.updatedAt, priority: 0.7 })
    }
    for (const post of posts.docs as Array<{ slug?: string; updatedAt?: string }>) {
      if (post.slug) urls.push({ loc: `${base}/bai-viet-chi-tiet/${post.slug}`, lastmod: post.updatedAt, priority: 0.6 })
    }
    for (const book of books.docs as Array<{ slug?: string; updatedAt?: string }>) {
      if (book.slug) urls.push({ loc: `${base}/sach/${book.slug}`, lastmod: book.updatedAt, priority: 0.5 })
    }
    for (const p of provinces.docs as Array<{ slug?: string; updatedAt?: string }>) {
      if (p.slug) urls.push({ loc: `${base}/tinh/${p.slug}`, lastmod: p.updatedAt, priority: 0.4 })
    }
    for (const s of subjects.docs as Array<{ slug?: string; updatedAt?: string }>) {
      if (s.slug) urls.push({ loc: `${base}/mon-hoc/${s.slug}`, lastmod: s.updatedAt, priority: 0.4 })
    }
    for (const year of STATIC_YEARS) urls.push({ loc: `${base}/nam/${year}`, priority: 0.4 })

    return Response.json({ urls, totalCount: urls.length })
  },
}
