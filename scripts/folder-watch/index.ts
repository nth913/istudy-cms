import 'dotenv/config'
import chokidar from 'chokidar'
import { readFile, rename, mkdir } from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import { parseExamFilename } from '../import-exams/parse-filename'
import { upsertExam } from '../import-exams/upsert-exam'
import { uploadOrReuseMedia } from '../import-exams/upload-media'
import { resolveProvinceId, resolveSubjectId } from '../import-exams/resolve-refs'

const WATCH_DIR = process.env.WATCH_DIR || './uploads/incoming'
const PROCESSED_DIR = process.env.PROCESSED_DIR || './uploads/processed'

async function processFile(filePath: string, payload: Awaited<ReturnType<typeof getPayload>>) {
  const filename = path.basename(filePath)
  const parsed = parseExamFilename(filename)
  if (!parsed.ok) {
    console.warn(`[watch] skip ${filename}: ${parsed.error}`)
    return
  }
  const buf = await readFile(filePath)
  const media = await uploadOrReuseMedia(payload, { filename, mimetype: 'application/pdf', data: buf })
  if (!media.id) {
    console.error(`[watch] media upload failed: ${media.message}`)
    return
  }
  const [subjectId, provinceId] = await Promise.all([
    resolveSubjectId(payload, parsed.data.subjectSlug),
    resolveProvinceId(payload, parsed.data.provinceSlug),
  ])
  const result = await upsertExam(payload, {
    title: parsed.data.titleSlug.replace(/-/g, ' '),
    slug: parsed.data.titleSlug,
    category: parsed.data.category,
    examType: parsed.data.examType,
    year: parsed.data.year,
    subjectId,
    provinceId,
    pdfFileId: media.id,
  })
  console.log(`[watch] ${filename}: ${result.status} ${result.slug || ''}`)
  try {
    await rename(filePath, path.join(PROCESSED_DIR, filename))
  } catch (err) {
    console.warn(`[watch] move failed (continue):`, err)
  }
}

async function main() {
  await mkdir(WATCH_DIR, { recursive: true })
  await mkdir(PROCESSED_DIR, { recursive: true })
  const payload = await getPayload({ config })
  console.log(`[watch] watching ${WATCH_DIR} (processed → ${PROCESSED_DIR})`)
  chokidar
    .watch(WATCH_DIR, { ignoreInitial: false, awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 } })
    .on('add', (p) => {
      if (p.toLowerCase().endsWith('.pdf')) {
        processFile(p, payload).catch((err) => console.error('[watch] error', err))
      }
    })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
