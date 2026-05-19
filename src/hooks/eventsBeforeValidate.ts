import type { CollectionBeforeValidateHook } from 'payload'
import { vietnameseSlugify } from '../lib/vietnamese-slugify'

export const eventsBeforeValidate: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data

  if (typeof data.slug === 'string' && data.slug.length > 0) {
    data.slug = vietnameseSlugify(data.slug)
  } else if (typeof data.title === 'string' && data.title.length > 0) {
    data.slug = vietnameseSlugify(data.title)
  }

  if (data.startAt && data.endAt) {
    const start = new Date(data.startAt as string | number | Date)
    const end = new Date(data.endAt as string | number | Date)
    if (end.getTime() <= start.getTime()) {
      throw new Error('endAt phải sau startAt')
    }
  }

  return data
}
