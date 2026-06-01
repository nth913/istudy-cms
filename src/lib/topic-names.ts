// src/lib/topic-names.ts
import type { Payload } from 'payload'
import { extractTagIds } from './tag-popularity'

/** Names from already-populated topic objects (depth>=1). */
export function topicNames(topics: unknown): string[] {
  if (!Array.isArray(topics)) return []
  return topics
    .map((t) => (t && typeof t === 'object' ? String((t as any).name ?? '') : ''))
    .filter(Boolean)
}

/** Resolve topic id strings → names (used in beforeChange where topics are ids). */
export async function topicNamesFromIds(payload: Payload, ids: string[]): Promise<string[]> {
  if (!ids.length) return []
  const res = await payload.find({
    collection: 'tags', where: { id: { in: ids } }, pagination: false, depth: 0, select: { name: true } as any,
  })
  return (res.docs as any[]).map((d) => d.name).filter(Boolean)
}

export { extractTagIds }
