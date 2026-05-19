const VALID_CATEGORY = new Set(['vao-10', 'vao-dai-hoc'])
const VALID_EXAM_TYPE = new Set(['chinh-thuc', 'thi-thu', 'minh-hoa'])
const VALID_YEAR = /^(20[0-9]{2})$/

export type ParsedFilename = {
  category: 'vao-10' | 'vao-dai-hoc'
  subjectSlug: string
  year: string
  examType: 'chinh-thuc' | 'thi-thu' | 'minh-hoa'
  provinceSlug?: string
  titleSlug: string
}

export type ParseResult =
  | { ok: true; data: ParsedFilename }
  | { ok: false; error: string }

export function parseExamFilename(name: string): ParseResult {
  if (!name.toLowerCase().endsWith('.pdf')) {
    return { ok: false, error: 'extension must be .pdf' }
  }
  const stem = name.slice(0, -4)
  const tokens = stem.split('__')
  if (tokens.length !== 5 && tokens.length !== 6) {
    return { ok: false, error: `expected 5 or 6 tokens, got ${tokens.length}` }
  }
  const [category, subjectSlug, year, examType, ...rest] = tokens
  if (!VALID_CATEGORY.has(category)) return { ok: false, error: `unknown category: ${category}` }
  if (!VALID_YEAR.test(year)) return { ok: false, error: `invalid year: ${year}` }
  if (!VALID_EXAM_TYPE.has(examType)) return { ok: false, error: `invalid examType: ${examType}` }

  let provinceSlug: string | undefined
  let titleSlug: string
  if (tokens.length === 6) {
    provinceSlug = rest[0]
    titleSlug = rest[1]
  } else {
    titleSlug = rest[0]
  }
  if (!titleSlug) return { ok: false, error: 'titleSlug missing' }

  return {
    ok: true,
    data: {
      category: category as 'vao-10' | 'vao-dai-hoc',
      subjectSlug,
      year,
      examType: examType as 'chinh-thuc' | 'thi-thu' | 'minh-hoa',
      provinceSlug,
      titleSlug,
    },
  }
}
