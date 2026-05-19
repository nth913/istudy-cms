import type { CollectionBeforeValidateHook } from 'payload'
import { vietnameseSlugify } from '../lib/vietnamese-slugify'

export const postsBeforeValidate: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (!data) return data

  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const currentSlug = typeof data.slug === 'string' ? data.slug.trim() : ''

  if (operation === 'create' && !title) {
    throw new Error('Tiêu đề bài viết là bắt buộc')
  }

  if (!currentSlug && title) {
    data.slug = vietnameseSlugify(title)
  } else if (currentSlug) {
    data.slug = vietnameseSlugify(currentSlug)
  }

  return data
}
