import type { CollectionAfterChangeHook } from 'payload'
import { notifySlack } from '../lib/slack'

export const examsAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation }) => {
  if (
    operation === 'update' &&
    previousDoc?._status === 'draft' &&
    doc?._status === 'published'
  ) {
    const feUrl = process.env.FE_URL || 'https://aistudy.com.vn'
    const slug = typeof doc?.slug === 'string' ? doc.slug : ''
    const title = typeof doc?.title === 'string' ? doc.title : ''
    await notifySlack(`📢 *Đề thi*: «${title}» đã publish → ${feUrl.replace(/\/+$/, '')}/de-thi-chi-tiet/${slug}`)
  }
  return doc
}
