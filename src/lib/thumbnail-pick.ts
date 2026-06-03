// istudy-cms/src/lib/thumbnail-pick.ts

/** FNV-1a 32-bit hash. Deterministic, no Math.random — stable across runs/tests. */
export function fnv1a(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    // 32-bit FNV prime multiply via shifts, keep unsigned
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

/** Stable index into a preset pool for a given slug. Returns 0 for empty pool. */
export function pickPresetIndex(slug: string, poolLength: number): number {
  if (poolLength <= 0) return 0
  return fnv1a(slug) % poolLength
}
