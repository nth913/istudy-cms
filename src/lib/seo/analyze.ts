/**
 * Pure SEO analysis utilities — no React, no Payload deps.
 * Used by SeoPanel (admin component) + any server-side scoring.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type LenStatus = 'ok' | 'warn' | 'bad'
export type CheckStatus = 'pass' | 'warn' | 'fail'

export interface LenScore {
  len: number
  status: LenStatus
}

export interface Check {
  id: string
  label: string
  status: CheckStatus
  hint?: string
}

export interface OnPageInput {
  title: string
  description: string
  slug: string
  bodyText: string
  focusKeyword: string
}

// ── Vietnamese diacritic map (subset sufficient for normalize) ─────────────

const DIAC: Record<string, string> = {
  à: 'a', á: 'a', ạ: 'a', ả: 'a', ã: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ậ: 'a', ẩ: 'a', ẫ: 'a',
  ă: 'a', ằ: 'a', ắ: 'a', ặ: 'a', ẳ: 'a', ẵ: 'a',
  è: 'e', é: 'e', ẹ: 'e', ẻ: 'e', ẽ: 'e',
  ê: 'e', ề: 'e', ế: 'e', ệ: 'e', ể: 'e', ễ: 'e',
  ì: 'i', í: 'i', ị: 'i', ỉ: 'i', ĩ: 'i',
  ò: 'o', ó: 'o', ọ: 'o', ỏ: 'o', õ: 'o',
  ô: 'o', ồ: 'o', ố: 'o', ộ: 'o', ổ: 'o', ỗ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ợ: 'o', ở: 'o', ỡ: 'o',
  ù: 'u', ú: 'u', ụ: 'u', ủ: 'u', ũ: 'u',
  ư: 'u', ừ: 'u', ứ: 'u', ự: 'u', ử: 'u', ữ: 'u',
  ỳ: 'y', ý: 'y', ỵ: 'y', ỷ: 'y', ỹ: 'y',
  đ: 'd',
  // uppercase variants
  À: 'a', Á: 'a', Ạ: 'a', Ả: 'a', Ã: 'a',
  Â: 'a', Ầ: 'a', Ấ: 'a', Ậ: 'a', Ẩ: 'a', Ẫ: 'a',
  Ă: 'a', Ằ: 'a', Ắ: 'a', Ặ: 'a', Ẳ: 'a', Ẵ: 'a',
  È: 'e', É: 'e', Ẹ: 'e', Ẻ: 'e', Ẽ: 'e',
  Ê: 'e', Ề: 'e', Ế: 'e', Ệ: 'e', Ể: 'e', Ễ: 'e',
  Ì: 'i', Í: 'i', Ị: 'i', Ỉ: 'i', Ĩ: 'i',
  Ò: 'o', Ó: 'o', Ọ: 'o', Ỏ: 'o', Õ: 'o',
  Ô: 'o', Ồ: 'o', Ố: 'o', Ộ: 'o', Ổ: 'o', Ỗ: 'o',
  Ơ: 'o', Ờ: 'o', Ớ: 'o', Ợ: 'o', Ở: 'o', Ỡ: 'o',
  Ù: 'u', Ú: 'u', Ụ: 'u', Ủ: 'u', Ũ: 'u',
  Ư: 'u', Ừ: 'u', Ứ: 'u', Ự: 'u', Ử: 'u', Ữ: 'u',
  Ỳ: 'y', Ý: 'y', Ỵ: 'y', Ỷ: 'y', Ỹ: 'y',
  Đ: 'd',
}

/**
 * Strip Vietnamese diacritics (including đ/Đ) and lowercase.
 * Used for diacritic-insensitive keyword matching.
 */
export function normalize(input: string): string {
  return input
    .split('')
    .map(ch => DIAC[ch] ?? ch)
    .join('')
    .toLowerCase()
}

// ── Lexical rich-text plain-text extractor ─────────────────────────────────

/** Recursively walk a Lexical JSON tree and collect all text node values. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walk(node: any, buf: string[]): void {
  if (typeof node?.text === 'string') {
    buf.push(node.text)
    return
  }
  if (Array.isArray(node?.children)) {
    for (const child of node.children) walk(child, buf)
  }
}

/**
 * Extract plain text from a Payload/Lexical rich-text value.
 * Returns '' for any non-Lexical or null/undefined input.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractPlainText(richText: any): string {
  if (!richText || typeof richText !== 'object') return ''
  if (!richText.root) return ''
  const buf: string[] = []
  walk(richText.root, buf)
  return buf.join('')
}

// ── SERP length scoring ────────────────────────────────────────────────────

/**
 * Title:       30-60 chars → ok | <30 → warn | >60 or empty → bad
 * Description: 80-160 chars → ok | <80 → warn | >160 or empty → bad
 *
 * (Google typically truncates at ~600px ≈ 60 Latin chars for title,
 *  and ~920px ≈ 160 chars for description. Vietnamese chars are wider,
 *  so these thresholds are intentionally conservative.)
 */
export function lengthScore(value: string, field: 'title' | 'description'): LenScore {
  const len = value.length
  if (field === 'title') {
    if (len === 0 || len > 70) return { len, status: 'bad' }
    if (len < 30) return { len, status: 'warn' }
    return { len, status: 'ok' }
  }
  // description
  if (len === 0 || len > 200) return { len, status: 'bad' }
  if (len < 80) return { len, status: 'warn' }
  return { len, status: 'ok' }
}

// ── On-page checks ─────────────────────────────────────────────────────────

/**
 * Run a standard set of on-page SEO checks.
 * Short-circuits after the first check (kw) when focusKeyword is empty.
 */
export function onPageChecks(input: OnPageInput): Check[] {
  const { title, description, slug, bodyText, focusKeyword } = input

  // 1. Keyword present
  if (!focusKeyword.trim()) {
    return [
      {
        id: 'kw',
        label: 'Từ khóa chính',
        status: 'fail',
        hint: 'Nhập từ khóa chính để chạy kiểm tra SEO.',
      },
    ]
  }

  const kw = normalize(focusKeyword.trim())
  const normTitle = normalize(title)
  const normDesc = normalize(description)
  const normSlug = normalize(slug).replace(/-/g, ' ')
  const normBody = normalize(bodyText)

  const checks: Check[] = []

  // 1. kw present (already confirmed above — mark pass)
  checks.push({ id: 'kw', label: 'Từ khóa chính', status: 'pass' })

  // 2. Keyword in title
  checks.push({
    id: 'title',
    label: 'Từ khóa trong tiêu đề',
    status: normTitle.includes(kw) ? 'pass' : 'fail',
    hint: normTitle.includes(kw) ? undefined : 'Tiêu đề nên chứa từ khóa chính.',
  })

  // 3. Keyword in description
  checks.push({
    id: 'desc',
    label: 'Từ khóa trong mô tả',
    status: normDesc.includes(kw) ? 'pass' : 'warn',
    hint: normDesc.includes(kw) ? undefined : 'Mô tả nên chứa từ khóa chính.',
  })

  // 4. Keyword in slug
  checks.push({
    id: 'slug',
    label: 'Từ khóa trong slug',
    status: normSlug.includes(kw) ? 'pass' : 'warn',
    hint: normSlug.includes(kw) ? undefined : 'Slug nên phản ánh từ khóa chính.',
  })

  // 5. Body not empty
  const hasBody = bodyText.trim().length > 0
  checks.push({
    id: 'body',
    label: 'Nội dung bài viết',
    status: hasBody ? 'pass' : 'warn',
    hint: hasBody ? undefined : 'Bài chưa có nội dung.',
  })

  // 6. Keyword density in body (target 0.5%–3%)
  let densityStatus: CheckStatus = 'warn'
  let densityHint: string | undefined = 'Chưa có nội dung để kiểm tra mật độ từ khóa.'
  if (hasBody) {
    const words = normBody.split(/\s+/).filter(Boolean)
    const kwWords = kw.split(/\s+/).filter(Boolean)
    // Count occurrences of the keyword phrase
    let hits = 0
    for (let i = 0; i <= words.length - kwWords.length; i++) {
      if (kwWords.every((w, j) => words[i + j] === w)) hits++
    }
    const density = words.length > 0 ? (hits * kwWords.length) / words.length : 0
    if (density >= 0.005 && density <= 0.03) {
      densityStatus = 'pass'
      densityHint = undefined
    } else if (density < 0.005) {
      densityStatus = 'warn'
      densityHint = `Mật độ từ khóa thấp (${(density * 100).toFixed(2)}%). Thêm từ khóa vào nội dung.`
    } else {
      densityStatus = 'warn'
      densityHint = `Mật độ từ khóa quá cao (${(density * 100).toFixed(2)}%). Tránh spam từ khóa.`
    }
  }
  checks.push({
    id: 'density',
    label: 'Mật độ từ khóa',
    status: densityStatus,
    hint: densityHint,
  })

  return checks
}
