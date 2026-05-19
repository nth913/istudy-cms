import { describe, it, expect } from 'vitest'
import { parseExamFilename, type ParseResult } from './parse-filename'

function assertOk(r: ParseResult) {
  if (!r.ok) throw new Error(`Expected ok, got error: ${r.error}`)
  return r.data
}

function assertFail(r: ParseResult) {
  if (r.ok) throw new Error('Expected failure, got ok')
  return r.error
}

describe('parseExamFilename', () => {
  it('parses 5-token vao-10 filename', () => {
    const r = parseExamFilename('vao-10__toan__2024__chinh-thuc__de-vao-10-ha-noi.pdf')
    expect(r.ok).toBe(true)
    expect(assertOk(r)).toEqual({
      category: 'vao-10',
      subjectSlug: 'toan',
      year: '2024',
      examType: 'chinh-thuc',
      provinceSlug: undefined,
      titleSlug: 'de-vao-10-ha-noi',
    })
  })

  it('parses 6-token vao-10 filename with province', () => {
    const r = parseExamFilename('vao-10__toan__2024__chinh-thuc__ha-noi__de-vao-10.pdf')
    expect(r.ok).toBe(true)
    const data = assertOk(r)
    expect(data.provinceSlug).toBe('ha-noi')
    expect(data.titleSlug).toBe('de-vao-10')
  })

  it('parses vao-dai-hoc filename (5 token)', () => {
    const r = parseExamFilename('vao-dai-hoc__hoa__2023__thi-thu__sgd-da-nang-lan-1.pdf')
    expect(r.ok).toBe(true)
    const data = assertOk(r)
    expect(data.category).toBe('vao-dai-hoc')
    expect(data.subjectSlug).toBe('hoa')
  })

  it('rejects unknown category', () => {
    const r = parseExamFilename('cao-hoc__toan__2024__chinh-thuc__de.pdf')
    expect(r.ok).toBe(false)
    expect(assertFail(r)).toMatch(/category/)
  })

  it('rejects bad year', () => {
    const r = parseExamFilename('vao-10__toan__abcd__chinh-thuc__de.pdf')
    expect(r.ok).toBe(false)
    expect(assertFail(r)).toMatch(/year/)
  })

  it('rejects bad examType', () => {
    const r = parseExamFilename('vao-10__toan__2024__bad-type__de.pdf')
    expect(r.ok).toBe(false)
    expect(assertFail(r)).toMatch(/examType/)
  })

  it('rejects non-pdf extension', () => {
    const r = parseExamFilename('vao-10__toan__2024__chinh-thuc__de.docx')
    expect(r.ok).toBe(false)
    expect(assertFail(r)).toMatch(/extension/)
  })

  it('rejects too few tokens', () => {
    const r = parseExamFilename('vao-10__toan__2024.pdf')
    expect(r.ok).toBe(false)
  })
})
