import type { CollectionBeforeChangeHook } from 'payload'
import { removeVietnameseDiacritics } from '../lib/vietnamese-slugify'

export const computeSearchKey: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data
  const parts = [data.title, data.school].filter(Boolean).join(' ')
  data.searchKey = removeVietnameseDiacritics(parts).toLowerCase()
  return data
}
