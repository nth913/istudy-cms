import type { CollectionAfterChangeHook } from 'payload'
import { notifySlack } from '../lib/slack'

const REVALIDATE_TIMEOUT_MS = 3000
const DEFAULT_PROD_URL = 'https://aistudy.com.vn'

function parseFeUrls(): string[] {
  const raw = process.env.FE_URL
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean)
}

function firstFeUrl(): string {
  return parseFeUrls()[0] || DEFAULT_PROD_URL
}

async function pingRevalidate(baseUrl: string, secret: string, body: string): Promise<void> {
  const webhookUrl = `${baseUrl}/api/revalidate`
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REVALIDATE_TIMEOUT_MS)
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'x-secret': secret, 'content-type': 'application/json' },
        body,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch {
    // fire-and-forget per URL
  }
}

async function revalidateForExam(slug: string): Promise<void> {
  const feUrls = parseFeUrls()
  const secret = process.env.REVALIDATE_SECRET
  if (feUrls.length === 0 || !secret) return
  const tags = ['mega-menu-kho-de', 'exams-list', 'exams-sidebar-facets']
  if (slug) tags.push(`exam:${slug}`)
  const paths = ['/kho-de-thi']
  if (slug) {
    paths.push(`/de-thi-chi-tiet/${slug}`)
    paths.push(`/dap-an/${slug}`)
  }
  const body = JSON.stringify({ tags, paths })
  await Promise.allSettled(feUrls.map((url) => pingRevalidate(url, secret, body)))
}

export const examsAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation }) => {
  // Slack notify on draft → published transition (preserve existing behavior)
  if (
    operation === 'update' &&
    previousDoc?._status === 'draft' &&
    doc?._status === 'published'
  ) {
    const feUrl = firstFeUrl()
    const slug = typeof doc?.slug === 'string' ? doc.slug : ''
    const title = typeof doc?.title === 'string' ? doc.title : ''
    await notifySlack(`📢 *Đề thi*: «${title}» đã publish → ${feUrl}/de-thi-chi-tiet/${slug}`)
  }

  // deReady transition false → true: Slack notify "đề đã có file"
  if (
    operation === 'update' &&
    previousDoc?.deReady === false &&
    doc?.deReady === true
  ) {
    const feUrl = firstFeUrl()
    const slug = typeof doc?.slug === 'string' ? doc.slug : ''
    const title = typeof doc?.title === 'string' ? doc.title : ''
    await notifySlack(`📄 *Đề*: «${title}» đã có file → ${feUrl}/de-thi-chi-tiet/${slug}`)
  }

  // Fire-and-forget combined revalidate. Supports comma-separated FE_URL so
  // dev workflow can ping both localhost web + prod web from a single CMS
  // local instance (e.g. FE_URL="http://localhost:3000,https://aistudy.com.vn").
  const slug = typeof doc?.slug === 'string' ? doc.slug : ''
  void revalidateForExam(slug)

  return doc
}
