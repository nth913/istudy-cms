import type { CollectionAfterChangeHook } from 'payload'
import { notifySlack } from '../lib/slack'

const REVALIDATE_TIMEOUT_MS = 3000

async function revalidateForExam(slug: string): Promise<void> {
  const feUrl = process.env.FE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!feUrl || !secret) return
  const webhookUrl = `${feUrl.replace(/\/+$/, '')}/api/revalidate`
  const tags = ['mega-menu-kho-de', 'exams-list', 'exams-sidebar-facets']
  if (slug) tags.push(`exam:${slug}`)
  const paths = ['/kho-de-thi']
  if (slug) {
    paths.push(`/de-thi-chi-tiet/${slug}`)
    paths.push(`/dap-an/${slug}`)
  }
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REVALIDATE_TIMEOUT_MS)
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'x-secret': secret, 'content-type': 'application/json' },
        body: JSON.stringify({ tags, paths }),
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

  // deReady transition false → true: Slack notify "đề đã có file"
  if (
    operation === 'update' &&
    previousDoc?.deReady === false &&
    doc?.deReady === true
  ) {
    const feUrl = process.env.FE_URL || 'https://aistudy.com.vn'
    const slug = typeof doc?.slug === 'string' ? doc.slug : ''
    const title = typeof doc?.title === 'string' ? doc.title : ''
    await notifySlack(`📄 *Đề*: «${title}» đã có file → ${feUrl.replace(/\/+$/, '')}/de-thi-chi-tiet/${slug}`)
  }

  // Fire-and-forget combined revalidate: mega menu chips + list + facets +
  // single exam detail page + tag scoped to this exam's slug. Editor edits
  // propagate to FE within the next request cycle (no 60s ISR wait).
  const slug = typeof doc?.slug === 'string' ? doc.slug : ''
  void revalidateForExam(slug)

  return doc
}
