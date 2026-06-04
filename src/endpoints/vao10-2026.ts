// src/endpoints/vao10-2026.ts
import type { Endpoint, PayloadRequest } from 'payload'
import { normProvinceKey } from '../lib/vao10-key'

// ── types ─────────────────────────────────────────────────────────────────────

type Vao10Item = {
  key: string
  slug: string | null
  thumbnailUrl: string | null
  examTitle: string | null
}

type Vao10Response = {
  items: Vao10Item[]
  updatedAt: string
}

// ── pure transform ─────────────────────────────────────────────────────────────

/**
 * Exported for unit tests — does NOT call Payload.
 * @param global  result of findGlobal({ slug: 'vao10-2026-config', depth: 1 })
 * @param serverUrl  process.env.PAYLOAD_PUBLIC_SERVER_URL or ''
 */
export function buildVao10Response(
  global: Record<string, unknown> | null | undefined,
  serverUrl: string,
): Vao10Response {
  const rawItems = (global as any)?.items ?? []

  const items: Vao10Item[] = (rawItems as any[]).map((row) => {
    const provinceName: string = row?.provinceName ?? ''
    const key = normProvinceKey(provinceName)

    // exam — relationship populated at depth:1 → object or null/undefined
    const exam = row?.exam && typeof row.exam === 'object' ? row.exam : null
    const isPublished = exam?._status === 'published'

    const slug: string | null = isPublished ? (exam?.slug ?? null) : null
    // chỉ trả title khi đã publish — không leak nội dung draft qua public endpoint
    const examTitle: string | null = isPublished ? (exam?.title ?? null) : null

    // thumbnail — upload field populated at depth:1 → object or null/undefined
    const media =
      row?.thumbnail && typeof row.thumbnail === 'object' ? row.thumbnail : null
    let thumbnailUrl: string | null = null
    if (media) {
      const rawUrl: string | null =
        (media as any)?.sizes?.card?.url ?? (media as any)?.url ?? null
      if (rawUrl) {
        thumbnailUrl = rawUrl.startsWith('/')
          ? `${serverUrl.replace(/\/$/, '')}${rawUrl}`
          : rawUrl
      }
    }

    return { key, slug, thumbnailUrl, examTitle }
  })

  const updatedAt: string =
    (global as any)?.updatedAt ?? new Date().toISOString()

  return { items, updatedAt }
}

// ── endpoint ───────────────────────────────────────────────────────────────────

export const vao102026Endpoint: Endpoint = {
  path: '/vao10/2026',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    try {
      const global = await req.payload.findGlobal({
        slug: 'vao10-2026-config',
        depth: 1,
      })
      const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? ''
      const body = buildVao10Response(global as any, serverUrl)
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      })
    } catch {
      return new Response(
        JSON.stringify({ items: [], updatedAt: new Date().toISOString() }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          },
        },
      )
    }
  },
}
