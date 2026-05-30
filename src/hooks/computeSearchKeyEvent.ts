// istudy-cms/src/hooks/computeSearchKeyEvent.ts
import type { CollectionBeforeChangeHook } from 'payload'
import { removeVietnameseDiacritics } from '../lib/vietnamese-slugify'

export const computeSearchKeyEvent: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data
  const parts = [data.title, data.short, data.heroEyebrow].filter(Boolean).join(' ')
  data.searchKeyEvent = removeVietnameseDiacritics(parts).toLowerCase().trim()
  return data
}
