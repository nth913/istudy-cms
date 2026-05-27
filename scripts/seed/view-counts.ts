import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')

const VIEW_POOL = [194, 931, 1413, 413, 931, 668, 768, 49, 31, 786] as const

function pick(): number {
  return VIEW_POOL[Math.floor(Math.random() * VIEW_POOL.length)]
}

const TARGETS = [
  { col: 'exams', field: 'views' },
  { col: 'posts', field: 'viewCount' },
  { col: 'events', field: 'views' },
  { col: 'books', field: 'views' },
] as const

async function seedViewCounts() {
  const payload = await getPayload({ config })

  for (const { col, field } of TARGETS) {
    const NativeColl = (payload.db as { collections: Record<string, { collection: any }> }).collections[col]
    if (!NativeColl?.collection) {
      console.warn(`[skip] collection ${col} not accessible`)
      continue
    }
    const docs = await NativeColl.collection
      .find({}, { projection: { _id: 1 } })
      .toArray()
    console.log(`[${col}] ${docs.length} doc`)

    if (docs.length === 0) continue

    const ops = docs.map((d: { _id: unknown }) => ({
      updateOne: {
        filter: { _id: d._id },
        update: { $set: { [field]: pick() } },
      },
    }))
    const result = await NativeColl.collection.bulkWrite(ops)
    console.log(`  → modified ${result.modifiedCount}/${docs.length}`)
  }

  process.exit(0)
}

seedViewCounts().catch((err) => {
  console.error('[seed-views] fail:', err)
  process.exit(1)
})
