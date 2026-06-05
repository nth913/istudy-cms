// scripts/migrate/media-purpose-to-purposes.ts
// One-shot idempotent migration: converts Media.purpose (string) → Media.purposes (string[])
// Run: pnpm tsx scripts/migrate/media-purpose-to-purposes.ts
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })
  // Access raw MongoDB collection to read legacy 'purpose' field (stripped by Payload schema)
  const col = (payload.db as any).connection.db.collection('media')

  const cursor = col.find({})
  let migrated = 0
  let skipped = 0

  console.log('Starting media purpose → purposes migration...')

  for await (const raw of cursor) {
    // Skip only if purposes already set to something meaningful (not just the defaultValue ['other'])
    const purposes: string[] = Array.isArray(raw.purposes) ? raw.purposes : []
    const alreadyMigrated = purposes.length > 0 && !(purposes.length === 1 && purposes[0] === 'other')
    if (alreadyMigrated) { skipped++; continue }

    const oldPurpose = typeof raw.purpose === 'string' && raw.purpose.length > 0 ? raw.purpose : 'other'
    await payload.update({
      collection: 'media',
      id: String(raw._id),
      data: { purposes: [oldPurpose] } as any,
    })
    migrated++
  }

  console.log(`Done. Migrated: ${migrated}, Skipped (already set): ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
