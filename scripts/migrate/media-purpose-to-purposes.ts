// scripts/migrate/media-purpose-to-purposes.ts
// One-shot idempotent migration: converts Media.purpose (string) → Media.purposes (string[])
// Run: pnpm tsx scripts/migrate/media-purpose-to-purposes.ts
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })
  let page = 1
  let migrated = 0
  let skipped = 0

  console.log('Starting media purpose → purposes migration...')

  while (true) {
    const result = await payload.find({ collection: 'media', limit: 100, page })

    for (const doc of result.docs) {
      const hasPurposes =
        Array.isArray((doc as any).purposes) && ((doc as any).purposes as string[]).length > 0
      if (hasPurposes) {
        skipped++
        continue
      }

      const oldPurpose = (doc as any).purpose as string | undefined
      const purposes = [oldPurpose && oldPurpose.length > 0 ? oldPurpose : 'other']

      await payload.update({ collection: 'media', id: String(doc.id), data: { purposes } as any })
      migrated++
    }

    if (!result.hasNextPage) break
    page++
  }

  console.log(`Done. Migrated: ${migrated}, Skipped (already set): ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
