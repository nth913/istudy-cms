// src/endpoints/search-meta-helpers.ts
import type { Payload } from 'payload'
import { WEIGHT_VIEWS } from '../lib/tag-popularity'

export interface PopularTagDTO { id: string; label: string; slug: string; hot: boolean }

export async function computePopularTags(payload: Payload, limit: number): Promise<PopularTagDTO[]> {
  const res = await payload.find({
    collection: 'tags',
    where: { usageCount: { greater_than: 0 } },
    sort: '-popularScore',
    limit,
    depth: 0,
  })
  return res.docs.map((t: any) => ({ id: String(t.id), label: t.name, slug: t.slug, hot: !!t.hot }))
}

function provinceId(val: unknown): string {
  if (!val) return ''
  return typeof val === 'string' ? val : String((val as any).id ?? '')
}

export async function computeTopProvinces(payload: Payload, limit: number): Promise<string[]> {
  const exams = await payload.find({
    collection: 'exams',
    where: { category: { equals: 'vao-10' }, _status: { equals: 'published' }, province: { exists: true } },
    pagination: false, depth: 0, select: { province: true, views: true } as any,
  })
  const agg = new Map<string, { count: number; views: number }>()
  for (const d of exams.docs as any[]) {
    const pid = provinceId(d.province)
    if (!pid) continue
    const cur = agg.get(pid) ?? { count: 0, views: 0 }
    cur.count += 1
    cur.views += Number(d.views) || 0
    agg.set(pid, cur)
  }
  const ranked = [...agg.entries()]
    .map(([id, { count, views }]) => ({ id, score: count + views * WEIGHT_VIEWS }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
  if (!ranked.length) return []
  const provs = await payload.find({
    collection: 'provinces',
    where: { id: { in: ranked.map((r) => r.id) } },
    pagination: false, depth: 0, select: { name: true } as any,
  })
  const nameById = new Map((provs.docs as any[]).map((p) => [String(p.id), p.name]))
  return ranked.map((r) => nameById.get(r.id)).filter(Boolean) as string[]
}
