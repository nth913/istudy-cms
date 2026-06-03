import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')
const { PROVINCES_SEED } = await import('../../src/seed/provinces')
const { SUBJECTS_SEED } = await import('../../src/seed/subjects')
const { EXAMS_SEED } = await import('../../src/seed/exams')

async function seed() {
  const payload = await getPayload({ config })

  console.log('Seeding Provinces...')
  for (const p of PROVINCES_SEED) {
    const existing = await payload.find({
      collection: 'provinces',
      where: { slug: { equals: p.slug } },
      limit: 1,
    })
    if (existing.docs.length === 0) {
      await payload.create({ collection: 'provinces', data: p as any })
    }
  }
  console.log(`✓ Provinces: ${PROVINCES_SEED.length} entries ensured`)

  console.log('Seeding Subjects...')
  for (const s of SUBJECTS_SEED) {
    const existing = await payload.find({
      collection: 'subjects',
      where: { slug: { equals: s.slug } },
      limit: 1,
    })
    if (existing.docs.length === 0) {
      await payload.create({ collection: 'subjects', data: s as any })
    }
  }
  console.log(`✓ Subjects: ${SUBJECTS_SEED.length} entries ensured`)

  console.log('Sample Exams require manual PDF upload via admin UI:')
  console.log(`Pending exam records: ${EXAMS_SEED.length}`)
  console.log('NOTE: Upload PDF placeholder via admin Media collection, then create Exam records referencing them.')

  const { seedPosts } = await import('../../src/seed/posts')
  await seedPosts(payload)

  const { seedEvents } = await import('../../src/seed/events')
  await seedEvents(payload)

  console.log('Seeding SearchConfig defaults...')
  await payload.updateGlobal({
    slug: 'search-config',
    data: {
      defaultTags: [
        { id: 'thpt', label: 'THPT', hot: false },
        { id: 'vao10', label: 'Vào 10', hot: false },
      ],
      defaultProvinces: [
        { name: 'Hà Nội' },
        { name: 'Hồ Chí Minh' },
      ],
      defaultTrending: [
        { label: 'Đề thi thử 2026 — Nghệ An lần 3', href: '/de-thi-chi-tiet/exam-thi-thu-2026-nghe-an-lan-3', delta: null },
      ],
      maxTagsSuggest: 3,
      maxProvincesSuggest: 3,
      maxTrendingSuggest: 3,
      loadingTimeoutMs: 13000,
    } as any,
  })
  console.log('✓ SearchConfig seeded')

  console.log('Seeding exam thumbnails...')
  const { seedExamThumbs } = await import('../../src/seed/exam-thumbs')
  await seedExamThumbs(payload)

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
