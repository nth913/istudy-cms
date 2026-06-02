const SYSTEM =
  'Bạn là chuyên gia SEO tiếng Việt cho nền tảng đề thi iStudy (aistudy.com.vn). ' +
  'Hãy viết SEO title, meta description, Open Graph title và focus keyword chuẩn SEO Google: ngắn gọn, hấp dẫn, tiếng Việt tự nhiên, không nhồi từ khóa. Chỉ trả JSON đúng schema.'

const BODY_MAX = 1500

export interface SuggestInput {
  title?: string
  excerpt?: string
  bodyText?: string
  collection?: string
}

export function buildSuggestMessages(input: SuggestInput): { system: string; user: string } {
  const body = (input.bodyText || '').slice(0, BODY_MAX)
  const parts = [
    input.collection ? `Loại nội dung: ${input.collection}` : '',
    input.title ? `Tiêu đề hiện tại: ${input.title}` : '',
    input.excerpt ? `Tóm tắt: ${input.excerpt}` : '',
    body ? `Nội dung:\n${body}` : '',
  ].filter(Boolean)
  const user =
    'Dựa trên thông tin sau, đề xuất SEO title (≤70 ký tự), meta description (≤160 ký tự), ' +
    'Open Graph title (≤95 ký tự), và 1 focus keyword tiếng Việt.\n\n' +
    parts.join('\n\n')
  return { system: SYSTEM, user }
}

export const SUGGEST_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    ogTitle: { type: 'string' },
    focusKeyword: { type: 'string' },
  },
  required: ['title', 'description', 'ogTitle', 'focusKeyword'],
  additionalProperties: false,
} as const

export interface Suggestion {
  title: string
  description: string
  ogTitle: string
  focusKeyword: string
}

export function parseSuggestion(raw: string): Suggestion {
  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(raw)
  } catch {
    throw new Error('AI trả về JSON không hợp lệ')
  }
  for (const k of ['title', 'description', 'ogTitle', 'focusKeyword'] as const) {
    if (typeof obj?.[k] !== 'string') throw new Error(`Thiếu trường ${k} trong gợi ý AI`)
  }
  return {
    title: obj.title as string,
    description: obj.description as string,
    ogTitle: obj.ogTitle as string,
    focusKeyword: obj.focusKeyword as string,
  }
}
