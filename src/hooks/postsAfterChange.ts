import type { CollectionAfterChangeHook } from 'payload'
import { notifySlack } from '../lib/slack'

let warned = false

export const postsAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation }) => {
  const isPublishedNow = doc?._status === 'published'
  const wasPublished = previousDoc?._status === 'published'

  // Existing revalidate webhook (preserved)
  if (isPublishedNow || wasPublished) {
    const feUrl = process.env.FE_URL
    const secret = process.env.REVALIDATE_SECRET
    if (!feUrl || !secret) {
      if (!warned) {
        warned = true
        console.warn('[posts.afterChange] FE_URL or REVALIDATE_SECRET missing — skipping revalidate webhook')
      }
    } else {
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const paths = ['/bai-viet']
      if (slug) paths.push(`/bai-viet-chi-tiet/${slug}`)
      void (async () => {
        try {
          await fetch(`${feUrl.replace(/\/+$/, '')}/api/revalidate`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
            body: JSON.stringify({ paths }),
          })
        } catch (err) {
          console.error('[posts.afterChange] revalidate webhook failed:', err)
        }
      })()
    }
  }

  // Slack notify on draft → published transition
  if (operation === 'update' && previousDoc?._status === 'draft' && doc?._status === 'published') {
    const feUrl = process.env.FE_URL || 'https://aistudy.com.vn'
    const slug = typeof doc?.slug === 'string' ? doc.slug : ''
    const title = typeof doc?.title === 'string' ? doc.title : ''
    await notifySlack(`📢 *Bài viết*: «${title}» đã publish → ${feUrl.replace(/\/+$/, '')}/bai-viet-chi-tiet/${slug}`)
  }

  return doc
}
