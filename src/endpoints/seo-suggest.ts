import type { Endpoint, PayloadRequest } from 'payload'
import Anthropic from '@anthropic-ai/sdk'
import { buildSuggestMessages, parseSuggestion, SUGGEST_JSON_SCHEMA } from '../lib/seo/suggest'

export const seoSuggestEndpoint: Endpoint = {
  path: '/seo/suggest',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const role = (req.user as { role?: string } | undefined)?.role
    if (role !== 'admin' && role !== 'editor') {
      return Response.json({ error: 'Không có quyền' }, { status: 403 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'Chưa cấu hình ANTHROPIC_API_KEY' }, { status: 503 })
    }
    const body = (typeof req.json === 'function' ? await req.json() : {}) as {
      title?: string; excerpt?: string; bodyText?: string; collection?: string
    }
    const { system, user } = buildSuggestMessages(body)
    try {
      const client = new Anthropic()
      const res = await (client.messages.create as (params: any) => Promise<any>)({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        output_config: { format: { type: 'json_schema', schema: SUGGEST_JSON_SCHEMA } },
        messages: [{ role: 'user', content: user }],
      })
      const text = (res.content.find((b: { type: string; text?: string }) => b.type === 'text') as { text?: string } | undefined)?.text ?? ''
      return Response.json(parseSuggestion(text))
    } catch (e) {
      const err = e as { status?: number; message?: string }
      const status = err?.status === 429 ? 429 : 502
      return Response.json({ error: err?.message || 'Lỗi gọi AI' }, { status })
    }
  },
}
