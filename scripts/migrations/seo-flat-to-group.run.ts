/**
 * Runner: execute SEO flat → group migration via Payload local API + raw MongoDB driver
 * for $unset of legacy flat fields.
 *
 * Run once after deploying SEO group field change:
 *   pnpm migrate:seo-flat-to-group
 *
 * Idempotent: re-running is safe — docs with `seo.title` already set are skipped.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { migrateSeoFlatToGroup, type MigrationDeps } from './seo-flat-to-group'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function main(): Promise<void> {
  // Defer Payload imports until AFTER dotenv loads env vars.
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')

  const payload = await getPayload({ config })
  const db = (payload.db as any).connection.db

  const deps: MigrationDeps = {
    findDocs: async (collection) => {
      const res = await payload.find({
        collection,
        depth: 0,
        limit: 0,
        pagination: false,
      })
      return res.docs
    },
    updateGroupField: async ({ collection, id, seo }) => {
      await payload.update({ collection, id, data: { seo } as any })
    },
    unsetFlatFields: async ({ collection, id, fields }) => {
      const unset = fields.reduce((acc, f) => ({ ...acc, [f]: '' }), {})
      await db.collection(collection).updateOne({ _id: id }, { $unset: unset })
    },
    logger: { info: console.log, warn: console.warn },
  }

  const postsResult = await migrateSeoFlatToGroup(deps, { collection: 'posts' })
  const booksResult = await migrateSeoFlatToGroup(deps, { collection: 'books' })

  console.log('Done:', { posts: postsResult, books: booksResult })
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
