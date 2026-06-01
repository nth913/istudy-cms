// scripts/seed/bootstrap-tags.ts
// Migration + facet seed: migrate Posts.tags (free-text) → topics + seed examType/year/subject tags
// Idempotent: upsertTag finds by slug before creating.
// Run: pnpm seed:tags  (requires DATABASE_URL + Atlas connection)
// Import-safe: DB-connecting run() body guarded by process.argv check.

import { vietnameseSlugify } from '../../src/lib/vietnamese-slugify'
import { recomputeAllTags } from '../../src/lib/tag-popularity'

// ─── Pure helpers (exported for unit tests) ────────────────────────────────

export const EXAM_TYPE_LABELS: Record<string, string> = {
  'chinh-thuc': 'Đề chính thức',
  'thi-thu': 'Đề thi thử',
  'minh-hoa': 'Đề minh hoạ',
}

/** Derive facet tag names from an exam document's fields. */
export function examFacetTagNames(exam: any): string[] {
  const out: string[] = []
  if (exam?.examType && EXAM_TYPE_LABELS[exam.examType]) {
    out.push(EXAM_TYPE_LABELS[exam.examType])
  }
  if (exam?.year) out.push(`Đề ${exam.year}`)
  const subjName = typeof exam?.subject === 'object' && exam.subject !== null
    ? (exam.subject as any)?.name
    : undefined
  if (subjName) out.push(String(subjName))
  return out
}

// ─── DB helpers (only called inside run()) ────────────────────────────────

async function upsertTag(payload: any, name: string, cache: Map<string, string>): Promise<string> {
  const slug = vietnameseSlugify(name)
  if (cache.has(slug)) return cache.get(slug)!
  const existing = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  let id: string
  if (existing.docs[0]) {
    id = String(existing.docs[0].id)
  } else {
    const created = await payload.create({ collection: 'tags', data: { name, slug } })
    id = String(created.id)
  }
  cache.set(slug, id)
  return id
}

// ─── Main migration body ─────────────────────────────────────────────────

async function run() {
  // Dynamic imports inside run() so vitest import of this file doesn't connect to Mongo
  const dotenv = await import('dotenv')
  const path = await import('path')
  const { fileURLToPath } = await import('url')
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
  dotenv.config({ path: path.resolve(__dirname, '../../.env') })

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')

  const payload = await getPayload({ config })
  const cache = new Map<string, string>()

  // ── 1) Migrate Posts free-text tags → topics ──────────────────────────
  payload.logger.info('[bootstrap-tags] Migrating Posts.tags → topics…')
  const posts = await payload.find({ collection: 'posts', pagination: false, depth: 0 })
  let postsMigrated = 0
  for (const p of posts.docs as any[]) {
    const freeTags: string[] = Array.isArray(p.tags) ? p.tags : []
    if (!freeTags.length) continue
    const newIds: string[] = []
    for (const t of freeTags) {
      newIds.push(await upsertTag(payload, String(t), cache))
    }
    const existingIds = new Set<string>(
      (p.topics ?? []).map((x: any) => String(typeof x === 'object' ? x.id : x))
    )
    const merged = Array.from(new Set([...existingIds, ...newIds]))
    await payload.update({ collection: 'posts', id: p.id, data: { topics: merged } })
    postsMigrated++
  }
  payload.logger.info(`[bootstrap-tags] Posts migrated: ${postsMigrated}`)

  // ── 2) Seed facet tags for Exams ──────────────────────────────────────
  payload.logger.info('[bootstrap-tags] Seeding facet tags for Exams…')
  const exams = await payload.find({ collection: 'exams', pagination: false, depth: 1 })
  let examTagged = 0
  for (const e of exams.docs as any[]) {
    const names = examFacetTagNames(e)
    if (!names.length) continue
    const newIds: string[] = []
    for (const n of names) {
      newIds.push(await upsertTag(payload, n, cache))
    }
    const existingIds = new Set<string>(
      (e.topics ?? []).map((x: any) => String(typeof x === 'object' ? x.id : x))
    )
    const merged = Array.from(new Set([...existingIds, ...newIds]))
    await payload.update({ collection: 'exams', id: e.id, data: { topics: merged } })
    examTagged++
  }
  payload.logger.info(`[bootstrap-tags] Exams tagged: ${examTagged}`)

  // ── 3) Recompute all tag popularity scores ───────────────────────────
  payload.logger.info('[bootstrap-tags] Recomputing tag popularity…')
  await recomputeAllTags(payload)

  payload.logger.info('[bootstrap-tags] done')
  process.exit(0)
}

// Run only when invoked directly (not when imported by tests)
if (process.argv[1] && process.argv[1].includes('bootstrap-tags')) {
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
