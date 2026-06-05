import type { CollectionAfterChangeHook, Payload } from 'payload'

export async function addPurposeTag(
  payload: Payload,
  mediaId: string | number,
  purpose: string,
): Promise<void> {
  const doc = await payload.findByID({ collection: 'media', id: String(mediaId) })
  const existing: string[] = Array.isArray(doc.purposes) ? (doc.purposes as string[]) : []
  if (existing.includes(purpose)) return
  await payload.update({
    collection: 'media',
    id: String(mediaId),
    data: { purposes: [...existing, purpose] } as any,
  })
}

export function makeMediaPurposeTagger(fieldName: string, purpose: string): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req }) => {
    const raw = doc[fieldName]
    const prevRaw = previousDoc?.[fieldName]
    const mediaId =
      typeof raw === 'object' && raw !== null
        ? (raw as { id: string }).id
        : (raw as string | null | undefined)
    const prevId =
      typeof prevRaw === 'object' && prevRaw !== null
        ? (prevRaw as { id: string }).id
        : (prevRaw as string | null | undefined)
    if (!mediaId || mediaId === prevId) return doc
    setImmediate(() =>
      addPurposeTag(req.payload, mediaId, purpose).catch((err) =>
        req.payload.logger.error({ err, mediaId, purpose }, '[media-purpose-tag] addPurposeTag failed'),
      ),
    )
    return doc
  }
}
