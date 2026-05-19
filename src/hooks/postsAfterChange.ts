import type { CollectionAfterChangeHook } from 'payload'

let warned = false

export const postsAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  const isPublishedNow = doc?._status === 'published'
  const wasPublished = previousDoc?._status === 'published'

  if (!isPublishedNow && !wasPublished) return doc

  const feUrl = process.env.FE_URL
  const secret = process.env.REVALIDATE_SECRET

  if (!feUrl || !secret) {
    if (!warned) {
      warned = true
      console.warn(
        '[posts.afterChange] FE_URL or REVALIDATE_SECRET missing — skipping revalidate webhook',
      )
    }
    return doc
  }

  const slug = typeof doc?.slug === 'string' ? doc.slug : ''
  const paths = ['/bai-viet']
  if (slug) paths.push(`/bai-viet-chi-tiet/${slug}`)

  void (async () => {
    try {
      await fetch(`${feUrl.replace(/\/+$/, '')}/api/revalidate`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-revalidate-secret': secret,
        },
        body: JSON.stringify({ paths }),
      })
    } catch (err) {
      console.error('[posts.afterChange] revalidate webhook failed:', err)
    }
  })()

  return doc
}
