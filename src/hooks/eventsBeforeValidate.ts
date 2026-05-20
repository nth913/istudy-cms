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

  // Auto-tick deReady when dapAnReady=true
  if (data.dapAnReady === true && data.deReady !== true) {
    data.deReady = true
  }

  // Default `short` from `title` (truncate 40 chars with ellipsis)
  if ((!data.short || data.short === '') && typeof data.title === 'string' && data.title.length > 0) {
    data.short = data.title.length <= 40 ? data.title : data.title.slice(0, 37) + '...'
  }

  // Validate examEndTime ≥ startAt
  // Cho phép examEndTime === startAt (giờ thi 0 phút edge case, hiếm nhưng không sai)
  if (data.examEndTime && data.startAt) {
    const start = new Date(data.startAt as string | number | Date)
    const end = new Date(data.examEndTime as string | number | Date)
    if (end.getTime() < start.getTime()) {
      throw new Error('Giờ kết thúc thi phải sau giờ bắt đầu')
    }
  }

  // Validate priority range 1-99 (Vietnamese error layer)
  if (typeof data.priority === 'number' && (data.priority < 1 || data.priority > 99)) {
    throw new Error('Priority phải trong khoảng 1-99')
  }

  return data
}
