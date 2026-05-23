import type { Endpoint, Payload, PayloadRequest } from 'payload'
import type { Exam } from '../payload-types'

type ExamItem = { slug: string; title: string; year: string; isHot: boolean }
type TabSlots = {
  chinhThuc: { years: Array<{ year: string; count: number }> }
  thiThu: { hot: ExamItem[]; new: ExamItem[] }
  minhHoa: { hot: ExamItem[]; new: ExamItem[] }
}

export type MegaMenuKhoDeResponse = {
  vao10: TabSlots
  thptQg: TabSlots
}

const CACHE_TTL_MS = 60_000
let cache: { at: number; data: MegaMenuKhoDeResponse } | null = null

const emptyTab = (): TabSlots => ({
  chinhThuc: { years: [] },
  thiThu: { hot: [], new: [] },
  minhHoa: { hot: [], new: [] },
})

async function resolveLatestYears(
  payload: Payload,
  category: string,
): Promise<Array<{ year: string; count: number }>> {
  const res = await payload.find({
    collection: 'exams',
    where: {
      category: { equals: category },
      examType: { equals: 'chinh-thuc' },
      _status: { equals: 'published' },
    },
    limit: 500,
    pagination: false,
  })
  const counts = new Map<string, number>()
  for (const d of res.docs as Exam[]) {
    if (d?.year == null) continue
    const y = String(d.year)
    counts.set(y, (counts.get(y) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 3)
    .map(([year, count]) => ({ year, count }))
}

async function resolveHotNewMix(
  payload: Payload,
  category: string,
  examType: string,
): Promise<{ hot: ExamItem[]; new: ExamItem[] }> {
  const now = new Date()
  const hotRes = await payload.find({
    collection: 'exams',
    where: {
      category: { equals: category },
      examType: { equals: examType },
      _status: { equals: 'published' },
      // Dotted key not narrowable by Payload Where<Exam> type — cast preserves filter.
      'tags.hot.enabled': { equals: true },
    } as any,
    sort: '-views',
    limit: 3,
  })
  const hot: ExamItem[] = (hotRes.docs as Exam[])
    .filter((d) => {
      const exp = d?.tags?.hot?.expiresAt
      return !exp || new Date(exp) > now
    })
    .map((d) => ({
      slug: d.slug ?? '',
      title: d.title,
      year: String(d.year ?? ''),
      isHot: true,
    }))

  const hotSlugs = hot.map((h) => h.slug)
  const newRes = await payload.find({
    collection: 'exams',
    where: {
      category: { equals: category },
      examType: { equals: examType },
      _status: { equals: 'published' },
      ...(hotSlugs.length ? { slug: { not_in: hotSlugs } } : {}),
    },
    sort: '-createdAt',
    limit: 3,
  })
  const newer: ExamItem[] = (newRes.docs as Exam[]).map((d) => ({
    slug: d.slug ?? '',
    title: d.title,
    year: String(d.year ?? ''),
    isHot: false,
  }))

  return { hot, new: newer }
}

async function buildResponse(payload: Payload): Promise<MegaMenuKhoDeResponse> {
  const [v10Years, v10TT, v10MH, thptYears, thptTT, thptMH] = await Promise.all([
    resolveLatestYears(payload, 'vao-10'),
    resolveHotNewMix(payload, 'vao-10', 'thi-thu'),
    resolveHotNewMix(payload, 'vao-10', 'minh-hoa'),
    resolveLatestYears(payload, 'vao-dai-hoc'),
    resolveHotNewMix(payload, 'vao-dai-hoc', 'thi-thu'),
    resolveHotNewMix(payload, 'vao-dai-hoc', 'minh-hoa'),
  ])
  return {
    vao10: { chinhThuc: { years: v10Years }, thiThu: v10TT, minhHoa: v10MH },
    thptQg: { chinhThuc: { years: thptYears }, thiThu: thptTT, minhHoa: thptMH },
  }
}

export const megaMenuKhoDeEndpoint: Endpoint = {
  path: '/mega-menu/kho-de',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    try {
      const now = Date.now()
      if (cache && now - cache.at < CACHE_TTL_MS) {
        return Response.json(cache.data)
      }
      const data = await buildResponse(req.payload)
      cache = { at: now, data }
      return Response.json(data)
    } catch (err) {
      req.payload.logger.error({ err }, 'mega-menu-kho-de endpoint failed')
      return Response.json({ vao10: emptyTab(), thptQg: emptyTab() })
    }
  },
}

export const __resetMegaMenuCache = () => {
  cache = null
}
