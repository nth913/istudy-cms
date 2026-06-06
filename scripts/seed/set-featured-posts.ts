// One-shot: set isFeatured=true on hero posts + fix publishedAt order
// vao10 post = main card (newer publishedAt), chien-luoc = side card
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')

const payload = await getPayload({ config })

const UPDATES = [
  {
    slug: 'de-chinh-thuc-vao-10-2026-tieng-anh',
    isFeatured: true,
    publishedAt: new Date('2026-06-07T08:00:00+07:00').toISOString(),
  },
  {
    slug: 'on-thi-tieng-anh-dai-hoc',
    isFeatured: true,
    publishedAt: new Date('2026-06-06T08:00:00+07:00').toISOString(),
  },
]

for (const u of UPDATES) {
  const found = await payload.find({
    collection: 'posts',
    where: { slug: { equals: u.slug } },
    limit: 1,
  })
  const doc = found.docs[0]
  if (!doc) {
    console.log(`✗ Not found: ${u.slug}`)
    continue
  }
  await payload.update({
    collection: 'posts',
    id: doc.id,
    data: { isFeatured: u.isFeatured, publishedAt: u.publishedAt },
  })
  console.log(`✓ Updated ${u.slug}: isFeatured=${u.isFeatured} publishedAt=${u.publishedAt}`)
}

process.exit(0)
