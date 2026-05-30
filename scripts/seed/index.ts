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
      popularTags: [
        { id: 'tk25', label: 'Đề tham khảo 2025', hot: true },
        { id: 'mh', label: 'Đề minh hoạ Bộ GD', hot: true },
        { id: 'hsa', label: 'HSA Đợt 1 — 2026', hot: true },
        { id: 'wf', label: 'Word formation', hot: false },
        { id: 'rc', label: 'Reading comprehension', hot: false },
        { id: 'st', label: 'Sentence transformation', hot: false },
        { id: 'cond', label: 'Câu điều kiện', hot: false },
        { id: 'pron', label: 'Pronunciation & Stress', hot: false },
      ],
      provinces: [
        { name: 'Hà Nội' }, { name: 'TP. Hồ Chí Minh' }, { name: 'Đà Nẵng' },
        { name: 'Hải Phòng' }, { name: 'Cần Thơ' }, { name: 'Nghệ An' },
        { name: 'Thanh Hoá' }, { name: 'Quảng Ninh' }, { name: 'Nam Định' }, { name: 'Bắc Ninh' },
      ],
      trendingItems: [
        { label: 'Đề tham khảo THPT 2026', delta: '+184%' },
        { label: 'HSA Đợt 1 — 2026', delta: '+92%' },
        { label: 'Đề vào 10 Hà Nội 2025', delta: '+41%' },
        { label: 'Sentence transformation', delta: '+12%' },
        { label: 'Word formation', delta: '' },
      ],
    },
  })
  console.log('✓ SearchConfig seeded')

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
