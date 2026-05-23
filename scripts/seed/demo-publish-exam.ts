/**
 * One-off demo: publish 1 exam-vao-10-ninh-binh-2026 với PDF placeholder
 * để verify /kho-de-thi list hiển thị. KHÔNG dùng cho production.
 *
 * Chạy: pnpm tsx scripts/seed/demo-publish-exam.ts /tmp/sample-de-vao-10.pdf
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const pdfPath = process.argv[2]
if (!pdfPath || !fs.existsSync(pdfPath)) {
  console.error('Usage: pnpm tsx scripts/seed/demo-publish-exam.ts <path-to-pdf>')
  process.exit(1)
}

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')

const payload = await getPayload({ config })

const buffer = fs.readFileSync(pdfPath)
const filename = path.basename(pdfPath)

console.log(`Uploading PDF ${filename} (${buffer.length} bytes)...`)
const media = await payload.create({
  collection: 'media',
  data: { alt: 'Sample đề thi placeholder' } as any,
  file: {
    data: buffer,
    mimetype: 'application/pdf',
    name: filename,
    size: buffer.length,
  } as any,
})
console.log(`✓ Media created: ${media.id}`)

const examSlug = 'exam-vao-10-ninh-binh-2026'
const existing = await payload.find({
  collection: 'exams',
  where: { slug: { equals: examSlug } },
  limit: 1,
})
if (!existing.docs[0]) {
  console.error(`Exam ${examSlug} not found. Run seed:event-2026-05-24 first.`)
  process.exit(1)
}

const updated = await payload.update({
  collection: 'exams',
  id: existing.docs[0].id,
  data: {
    pdfFile: media.id as any,
    _status: 'published',
  } as any,
})
console.log(`✓ Exam ${examSlug} published with pdfFile=${media.id}`)
console.log(`Visit http://localhost:3000/kho-de-thi to verify`)
process.exit(0)
