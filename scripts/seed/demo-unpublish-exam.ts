/**
 * Revert exam-vao-10-ninh-binh-2026 từ published → draft (xoá pdfFile).
 * Dùng sau demo-publish-exam.ts khi muốn quay lại waiting state.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const slug = process.argv[2] || 'exam-vao-10-ninh-binh-2026'

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'exams',
  where: { slug: { equals: slug } },
  limit: 1,
})
if (!existing.docs[0]) {
  console.error(`Exam ${slug} not found`)
  process.exit(1)
}

await payload.update({
  collection: 'exams',
  id: existing.docs[0].id,
  data: { pdfFile: null, _status: 'draft' } as any,
})
console.log(`✓ Exam ${slug} reverted to draft (pdfFile cleared)`)
process.exit(0)
