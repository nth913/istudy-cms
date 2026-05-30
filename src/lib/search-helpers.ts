// istudy-cms/src/lib/search-helpers.ts
export function formatVN(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

export function extractRichText(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (typeof node.text === 'string') return node.text
  const children = node.children || node.root?.children || []
  if (!Array.isArray(children)) return ''
  return children.map(extractRichText).join('')
}

const CHARS_PER_MINUTE = 1000

export function minutesRead(richText: any): number {
  const text = extractRichText(richText)
  const chars = text.length
  return Math.max(1, Math.ceil(chars / CHARS_PER_MINUTE))
}
