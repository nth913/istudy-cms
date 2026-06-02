// src/endpoints/search-config.ts
import type { Endpoint, PayloadRequest } from 'payload'

const D = { maxTags: 3, maxProvinces: 3, maxTrending: 3, loadingTimeoutMs: 13000 }

export const searchConfigEndpoint: Endpoint = {
  path: '/search/config',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const cfg = (await req.payload.findGlobal({ slug: 'search-config' })) as any
    const body = {
      maxTags: Number(cfg?.maxTagsSuggest) || D.maxTags,
      maxProvinces: Number(cfg?.maxProvincesSuggest) || D.maxProvinces,
      maxTrending: Number(cfg?.maxTrendingSuggest) || D.maxTrending,
      loadingTimeoutMs: Number(cfg?.loadingTimeoutMs) || D.loadingTimeoutMs,
      defaultTags: (cfg?.defaultTags ?? []).map((t: any) => ({ id: t.id, label: t.label, hot: !!t.hot })),
      defaultProvinces: (cfg?.defaultProvinces ?? []).map((p: any) => p.name).filter(Boolean),
      defaultTrending: (cfg?.defaultTrending ?? []).map((t: any) => ({ label: t.label, href: t.href || undefined, delta: t.delta || null })),
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    })
  },
}
