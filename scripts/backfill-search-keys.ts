// istudy-cms/scripts/backfill-search-keys.ts
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  console.log('Backfilling posts...')
  const posts = await payload.find({ collection: 'posts', limit: 1000, depth: 0 })
  for (const p of posts.docs) {
    await payload.update({
      collection: 'posts',
      id: p.id,
      data: { title: p.title }, // touch to retrigger beforeChange hook
    })
  }
  console.log(`  ${posts.docs.length} posts updated`)

  console.log('Backfilling events...')
  const events = await payload.find({ collection: 'events', limit: 1000, depth: 0 })
  for (const e of events.docs) {
    await payload.update({
      collection: 'events',
      id: e.id,
      data: { title: e.title },
    })
  }
  console.log(`  ${events.docs.length} events updated`)

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
