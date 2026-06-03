import type { CollectionBeforeChangeHook } from 'payload'
import { removeVietnameseDiacritics } from '../lib/vietnamese-slugify'

export const computeSearchKey: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data
  // Skip on partial updates that touch neither searchable field, so the stored
  // searchKey is preserved (prevents the backfill migration from wiping it).
  if (!('title' in data) && !('school' in data)) return data
  const title = 'title' in data ? data.title : originalDoc?.title
  const school = 'school' in data ? data.school : originalDoc?.school
  const parts = [title, school].filter(Boolean).join(' ')
  data.searchKey = removeVietnameseDiacritics(parts).toLowerCase()
  return data
}
