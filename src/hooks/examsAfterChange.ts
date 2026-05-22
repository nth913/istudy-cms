import type { CollectionAfterChangeHook } from 'payload'
import { notifySlack } from '../lib/slack'

const REVALIDATE_TAG = 'mega-menu-kho-de'
const REVALIDATE_TIMEOUT_MS = 3000

async function revalidateMegaMenu(): Promise<void> {
  const webhookUrl = process.env.WEB_REVALIDATE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!webhookUrl || !secret) return
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REVALIDATE_TIMEOUT_MS)
    try {
      await fetch(`${webhookUrl}?tag=${REVALIDATE_TAG}`, {
        method: 'POST',
        headers: { 'x-secret': secret, 'content-type': 'application/json' },
        body: '{}',
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch {
    // fire-and-forget — silent fail (network error, abort, etc.)
  }
}

export const examsAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation }) => {
  // Slack notify on draft → published transition (preserve existing behavior)
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

  // Fire-and-forget mega menu revalidate (every change, so editor edits to a
  // published exam also refresh slot data on FE).
  void revalidateMegaMenu()

  return doc
}
