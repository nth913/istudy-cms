// istudy-cms/scripts/seed/reset-exam-thumbs.ts
//
// Reset utility (inverse of `migrate:exam-thumbs`): clears `thumbnail` +
// `thumbnailAuto` on ALL exams. Useful to re-test the backfill from a clean
// state. Does NOT delete the preset Media docs — only unsets the exam refs.
//
// IMPORTANT: passes `context.skipThumbnailHook` so `assignExamThumbnail` does
// NOT immediately re-assign a preset (setting thumbnail empty would otherwise
// trigger auto-fill). The skip + partial-update guards also preserve
// deReady/dapAnReady/searchKey.
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')

const payload = await getPayload({ config })

const exams = await payload.find({
  collection: 'exams',
  where: { thumbnail: { exists: true } },
  limit: 10000,
  depth: 0,
  draft: true,
})

let cleared = 0
for (const exam of exams.docs as any[]) {
  if (!exam.thumbnail) continue
  await payload.update({
    collection: 'exams',
    id: exam.id,
    data: { thumbnail: null, thumbnailAuto: false } as any,
    context: { skipThumbnailHook: true },
    draft: exam._status !== 'published',
  })
  cleared++
}
console.log(`✓ Cleared thumbnail on ${cleared} exam(s) of ${exams.docs.length} candidate(s)`)
process.exit(0)
