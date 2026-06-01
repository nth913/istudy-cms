// istudy-cms/src/hooks/computeSearchKeyPost.ts
import type { CollectionBeforeChangeHook } from 'payload'
import { removeVietnameseDiacritics } from '../lib/vietnamese-slugify'
import { extractTagIds, topicNamesFromIds } from '../lib/topic-names'

export const computeSearchKeyPost: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data
  const ids = extractTagIds(data.topics)
  const names = req?.payload ? await topicNamesFromIds(req.payload, ids) : []
  const parts = [data.title, data.excerpt, names.join(' ')].filter(Boolean).join(' ')
  data.searchKeyPost = removeVietnameseDiacritics(parts).toLowerCase().trim()
  return data
}
