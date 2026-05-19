import { vietnameseSlugify } from './vietnamese-slugify'

const MAX_BASE_LEN = 80

export function sanitizeFilename(name: string): string {
  const lastDot = name.lastIndexOf('.')
  const hasExt = lastDot > 0 && lastDot < name.length - 1
  const rawBase = hasExt ? name.slice(0, lastDot) : name
  const rawExt = hasExt ? name.slice(lastDot + 1).toLowerCase() : ''

  let base = vietnameseSlugify(rawBase)
  if (!base) base = 'file'
  if (base.length > MAX_BASE_LEN) base = base.slice(0, MAX_BASE_LEN).replace(/-+$/, '')

  const ext = rawExt.replace(/[^a-z0-9]+/g, '')
  return ext ? `${base}.${ext}` : base
}
