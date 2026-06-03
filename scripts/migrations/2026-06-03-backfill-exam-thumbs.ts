// istudy-cms/scripts/migrations/2026-06-03-backfill-exam-thumbs.ts
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')
const { pickPresetIndex } = await import('../../src/lib/thumbnail-pick')

const payload = await getPayload({ config })

const pool = await payload.find({
  collection: 'media' as any,
  where: { purpose: { equals: 'exam_thumbnail' } },
  sort: 'filename',
  limit: 100,
  depth: 0,
})
if (pool.docs.length === 0) {
  console.error('No exam_thumbnail presets found. Run `pnpm seed:exam-thumbs` first.')
  process.exit(1)
}

const exams = await payload.find({
  collection: 'exams',
  where: { thumbnail: { exists: false } },
  limit: 10000,
  depth: 0,
  draft: true,
})

let updated = 0
for (const exam of exams.docs as any[]) {
  if (exam.thumbnail) continue
  const idx = pickPresetIndex(String(exam.slug ?? ''), pool.docs.length)
  await payload.update({
    collection: 'exams',
    id: exam.id,
    data: { thumbnail: pool.docs[idx].id, thumbnailAuto: true } as any,
    context: { skipThumbnailHook: true },
    draft: exam._status !== 'published',
  })
  updated++
}
console.log(`✓ Backfilled ${updated} exam(s) of ${exams.docs.length} candidate(s)`)
process.exit(0)
