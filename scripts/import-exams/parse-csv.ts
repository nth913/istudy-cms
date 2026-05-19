import Papa from 'papaparse'

const REQUIRED_COLS = [
  'title', 'slug', 'category', 'examType', 'year',
  'subjectSlug', 'provinceSlug', 'school', 'pdfFileName', 'answerFileName',
] as const

const VALID_CATEGORY = new Set(['vao-10', 'vao-dai-hoc'])
const VALID_EXAM_TYPE = new Set(['chinh-thuc', 'thi-thu', 'minh-hoa'])

export type CsvRow = {
  title: string
  slug?: string
  category: 'vao-10' | 'vao-dai-hoc'
  examType: 'chinh-thuc' | 'thi-thu' | 'minh-hoa'
  year: string
  subjectSlug?: string
  provinceSlug?: string
  school?: string
  pdfFileName: string
  answerFileName?: string
}

export type CsvError = { rowIndex: number; message: string }

export type CsvParseResult = {
  rows: CsvRow[]
  errors: CsvError[]
  headerError?: string
}

export function parseExamsCsv(csv: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
  if (parsed.errors.length > 0 && parsed.errors[0].code === 'TooFewFields') {
    return { rows: [], errors: [], headerError: parsed.errors[0].message }
  }
  const headers = parsed.meta.fields || []
  const missing = REQUIRED_COLS.filter((c) => !headers.includes(c))
  if (missing.length > 0) {
    return { rows: [], errors: [], headerError: `missing columns: ${missing.join(', ')}` }
  }

  const rows: CsvRow[] = []
  const errors: CsvError[] = []

  parsed.data.forEach((raw, i) => {
    const title = (raw.title || '').trim()
    const category = (raw.category || '').trim()
    const examType = (raw.examType || '').trim()
    const year = (raw.year || '').trim()
    const pdfFileName = (raw.pdfFileName || '').trim()

    if (!title) return errors.push({ rowIndex: i, message: 'title required' })
    if (!VALID_CATEGORY.has(category)) return errors.push({ rowIndex: i, message: `bad category: ${category}` })
    if (!VALID_EXAM_TYPE.has(examType)) return errors.push({ rowIndex: i, message: `bad examType: ${examType}` })
    if (!/^20\d{2}$/.test(year)) return errors.push({ rowIndex: i, message: `bad year: ${year}` })
    if (!pdfFileName) return errors.push({ rowIndex: i, message: 'pdfFileName required' })

    rows.push({
      title,
      slug: (raw.slug || '').trim() || undefined,
      category: category as CsvRow['category'],
      examType: examType as CsvRow['examType'],
      year,
      subjectSlug: (raw.subjectSlug || '').trim() || undefined,
      provinceSlug: (raw.provinceSlug || '').trim() || undefined,
      school: (raw.school || '').trim() || undefined,
      pdfFileName,
      answerFileName: (raw.answerFileName || '').trim() || undefined,
    })
  })

  return { rows, errors }
}
