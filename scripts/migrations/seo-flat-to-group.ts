/**
 * Migration core: Posts/Books flat SEO fields (`seoTitle`, `seoDescription`, `ogImage`)
 * → grouped `seo` field (`{ title, description, ogImage, ogTitle, ogDescription }`).
 *
 * Pure function with injected deps so it can be unit-tested without a Payload instance.
 * The actual MongoDB / Payload local API wiring lives in `seo-flat-to-group.run.ts`.
 *
 * Idempotent: docs that already have `seo.title` set are skipped.
 */

type MigrateCollection = 'posts' | 'books'

export type MigrationDeps = {
  findDocs: (collection: MigrateCollection) => Promise<any[]>
  updateGroupField: (args: { collection: MigrateCollection; id: string; seo: any }) => Promise<void>
  unsetFlatFields: (args: { collection: MigrateCollection; id: string; fields: string[] }) => Promise<void>
  logger: { info: (msg: string) => void; warn: (msg: string) => void }
}

const FLAT_FIELDS_BY_COLLECTION: Record<MigrateCollection, string[]> = {
  posts: ['seoTitle', 'seoDescription', 'ogImage'],
  books: ['seoTitle', 'seoDescription'],
}

export async function migrateSeoFlatToGroup(
  deps: MigrationDeps,
  opts: { collection: MigrateCollection },
): Promise<{ migrated: number; skipped: number }> {
  if (opts.collection !== 'posts' && opts.collection !== 'books') {
    throw new Error(`migrateSeoFlatToGroup chỉ chạy cho posts hoặc books, nhận: ${opts.collection}`)
  }

  const docs = await deps.findDocs(opts.collection)
  let migrated = 0
  let skipped = 0

  for (const doc of docs) {
    if (doc.seo?.title) {
      skipped++
      continue
    }

    const seo = {
      title: doc.seoTitle ?? null,
      description: doc.seoDescription ?? null,
      ogImage: opts.collection === 'posts' ? (doc.ogImage ?? null) : null,
      ogTitle: null,
      ogDescription: null,
    }

    await deps.updateGroupField({ collection: opts.collection, id: doc.id, seo })
    await deps.unsetFlatFields({
      collection: opts.collection,
      id: doc.id,
      fields: FLAT_FIELDS_BY_COLLECTION[opts.collection],
    })
    migrated++
  }

  deps.logger.info(`[seo-flat-to-group] ${opts.collection}: migrated=${migrated} skipped=${skipped}`)
  return { migrated, skipped }
}
