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

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
