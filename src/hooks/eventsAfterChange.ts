import type { CollectionAfterChangeHook } from 'payload'

export const eventsAfterChange: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc?._status === 'published'
  if (!wasPublished && !isPublished) return doc

  const feUrl = process.env.FE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!feUrl || !secret) {
    console.warn('[eventsAfterChange] FE_URL hoặc REVALIDATE_SECRET thiếu, bỏ qua revalidate')
    return doc
  }

  try {
    void fetch(`${feUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ paths: ['/', '/cho-de'] }),
    }).catch((err) => {
      console.warn('[eventsAfterChange] revalidate fetch failed', err)
    })
  } catch (err) {
    console.warn('[eventsAfterChange] revalidate threw', err)
  }

  return doc
}
