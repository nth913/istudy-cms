import { LRUCache } from 'lru-cache'

/**
 * In-memory dedup for view tracking. Key format: `${aid}:${refType}:${refId}`.
 * 30-minute TTL, cap 100K entries (~10MB).
 * Single-instance only — multi-instance future requires Redis (deferred).
 */
export const viewDedupCache = new LRUCache<string, true>({
  max: 100_000,
  ttl: 30 * 60 * 1000,
  updateAgeOnGet: false,
})
