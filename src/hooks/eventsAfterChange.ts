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

    const autoSetPostedAt = async (
      field: 'dePostedAt' | 'dapAnPostedAt',
      logKind: 'event-de' | 'event-dapan',
    ) => {
      if (doc[field]) return
      const now = new Date().toISOString()
      try {
        await req.payload.update({
          collection: 'events',
          id: doc.id,
          data: { [field]: now },
          context: { skipHooks: true },
        })
        doc[field] = now
        // Dispatch log placeholder — real Resend integration defer Sprint D.
        // Use payload logger (pino) when available, fall back to console.log for test mocks.
        const logFn = req.payload?.logger?.info?.bind(req.payload.logger) ?? null
        if (logFn) {
          logFn({ kind: logKind, eventId: doc.id, slug: doc.slug }, 'event-publish dispatch')
        } else {
          console.log(`[event-publish] kind=${logKind} eventId=${doc.id} slug=${doc.slug}`)
        }
      } catch (err) {
        console.warn(`[eventsAfterChange] failed to set ${field}`, err)
      }
    }

    if (!wasDeReady && isDeReady) await autoSetPostedAt('dePostedAt', 'event-de')
    if (!wasDapAnReady && isDapAnReady) await autoSetPostedAt('dapAnPostedAt', 'event-dapan')
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
