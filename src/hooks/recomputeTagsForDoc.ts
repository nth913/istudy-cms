// src/hooks/recomputeTagsForDoc.ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { extractTagIds, recomputeTags } from '../lib/tag-popularity'

export const recomputeTagsAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const ids = [...extractTagIds((doc as any)?.topics), ...extractTagIds((previousDoc as any)?.topics)]
  if (ids.length) await recomputeTags(req.payload, ids)
  return doc
}

export const recomputeTagsAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const ids = extractTagIds((doc as any)?.topics)
  if (ids.length) await recomputeTags(req.payload, ids)
  return doc
}
