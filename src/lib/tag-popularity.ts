// src/lib/tag-popularity.ts
import type { Payload } from 'payload'

export const WEIGHT_VIEWS = 0.001

export function computePopularScore(usageCount: number, viewsSum: number): number {
  return usageCount + viewsSum * WEIGHT_VIEWS
}

export function extractTagIds(topics: unknown): string[] {
  if (!Array.isArray(topics)) return []
  return topics
    .map((t) => (typeof t === 'string' ? t : t && typeof t === 'object' ? String((t as any).id ?? '') : ''))
    .filter(Boolean)
}

async function usageFor(payload: Payload, tagId: string): Promise<{ count: number; views: number }> {
  const [exams, posts] = await Promise.all([
    payload.find({
      collection: 'exams',
      where: { _status: { equals: 'published' }, topics: { in: [tagId] } },
      pagination: false, depth: 0, select: { views: true } as any,
    }),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' }, topics: { in: [tagId] } },
      pagination: false, depth: 0, select: { viewCount: true } as any,
    }),
  ])
  const views =
    exams.docs.reduce((n: number, d: any) => n + (Number(d.views) || 0), 0) +
    posts.docs.reduce((n: number, d: any) => n + (Number(d.viewCount) || 0), 0)
  return { count: exams.docs.length + posts.docs.length, views }
}

export async function recomputeTags(payload: Payload, tagIds: string[]): Promise<void> {
  const unique = Array.from(new Set(tagIds.filter(Boolean)))
  for (const id of unique) {
    const { count, views } = await usageFor(payload, id)
    try {
      await payload.update({
        collection: 'tags', id,
        data: { usageCount: count, popularScore: computePopularScore(count, views) },
      })
    } catch (err) {
      payload.logger?.error?.({ err, id }, '[tag-popularity] update failed')
    }
  }
}

export async function recomputeAllTags(payload: Payload): Promise<void> {
  const all = await payload.find({ collection: 'tags', pagination: false, depth: 0, select: { id: true } as any })
  await recomputeTags(payload, all.docs.map((d: any) => String(d.id)))
}
