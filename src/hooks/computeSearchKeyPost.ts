// istudy-cms/src/hooks/computeSearchKeyPost.ts
import type { CollectionBeforeChangeHook } from 'payload'
import { removeVietnameseDiacritics } from '../lib/vietnamese-slugify'

export const computeSearchKeyPost: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data
  const tags = Array.isArray(data.tags) ? data.tags.join(' ') : ''
  const parts = [data.title, data.excerpt, tags].filter(Boolean).join(' ')
  data.searchKeyPost = removeVietnameseDiacritics(parts).toLowerCase().trim()
  return data
}
