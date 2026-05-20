import type { CollectionAfterChangeHook } from 'payload'

export const eventsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  // Q5 decision: skip autosave + skip draft
  const isAutosave = req?.context?.autosave === true
  const isPublished = doc?._status === 'published'

  if (!isAutosave && isPublished) {
    const wasDeReady = previousDoc?.deReady === true
    const isDeReady = doc?.deReady === true
    const wasDapAnReady = previousDoc?.dapAnReady === true
    const isDapAnReady = doc?.dapAnReady === true

    // Auto-set dePostedAt on 0→1 transition
    if (!wasDeReady && isDeReady && !doc.dePostedAt) {
      const now = new Date().toISOString()
      try {
        await req.payload.update({
          collection: 'events',
          id: doc.id,
          data: { dePostedAt: now },
          context: { skipHooks: true },
        })
        doc.dePostedAt = now
      } catch (err) {
        console.warn('[eventsAfterChange] failed to set dePostedAt', err)
      }
      console.log(`[event-publish] kind=event-de eventId=${doc.id} slug=${doc.slug}`)
    }

    // Auto-set dapAnPostedAt on 0→1 transition
    if (!wasDapAnReady && isDapAnReady && !doc.dapAnPostedAt) {
      const now = new Date().toISOString()
      try {
        await req.payload.update({
          collection: 'events',
          id: doc.id,
          data: { dapAnPostedAt: now },
          context: { skipHooks: true },
        })
        doc.dapAnPostedAt = now
      } catch (err) {
        console.warn('[eventsAfterChange] failed to set dapAnPostedAt', err)
      }
      console.log(`[event-publish] kind=event-dapan eventId=${doc.id} slug=${doc.slug}`)
    }
  }

  // PRESERVE existing FE revalidate trigger (unchanged from previous behaviour)
  const wasPublished = previousDoc?._status === 'published'
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
