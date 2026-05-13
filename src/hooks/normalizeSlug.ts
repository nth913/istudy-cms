import type { CollectionBeforeValidateHook } from 'payload'
import { vietnameseSlugify } from '../lib/vietnamese-slugify'

export const normalizeSlug: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data
  if (typeof data.slug === 'string' && data.slug.length > 0) {
    data.slug = vietnameseSlugify(data.slug)
  }
  return data
}
