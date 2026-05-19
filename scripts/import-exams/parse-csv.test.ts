import { describe, it, expect } from 'vitest'
import { parseExamsCsv } from './parse-csv'

const HEADER = 'title,slug,category,examType,year,subjectSlug,provinceSlug,school,pdfFileName,answerFileName'

describe('parseExamsCsv', () => {
  it('parses valid 2-row csv', () => {
    const csv = [
      HEADER,
      'Đề Toán 2024,,vao-10,chinh-thuc,2024,toan,ha-noi,THCS Nguyễn Du,de1.pdf,',
      'Đề Hoá 2023,de-hoa-2023,vao-dai-hoc,thi-thu,2023,hoa,,,de2.pdf,da2.pdf',
    ].join('\n')
    const r = parseExamsCsv(csv)
    expect(r.errors).toEqual([])
    expect(r.rows).toHaveLength(2)
    expect(r.rows[0]).toMatchObject({
      title: 'Đề Toán 2024',
      slug: undefined,
      category: 'vao-10',
      examType: 'chinh-thuc',
      year: '2024',
      subjectSlug: 'toan',
      provinceSlug: 'ha-noi',
      school: 'THCS Nguyễn Du',
      pdfFileName: 'de1.pdf',
      answerFileName: undefined,
    })
    expect(r.rows[1].slug).toBe('de-hoa-2023')
    expect(r.rows[1].answerFileName).toBe('da2.pdf')
  })

  it('reports row errors but continues parsing', () => {
    const csv = [
      HEADER,
      ',,vao-10,chinh-thuc,2024,toan,,,de.pdf,', // missing title
      'OK,,vao-10,bad-type,2024,toan,,,de.pdf,', // bad examType
      'OK2,,vao-10,chinh-thuc,2024,toan,,,de2.pdf,', // ok
    ].join('\n')
    const r = parseExamsCsv(csv)
    expect(r.errors).toHaveLength(2)
    expect(r.errors[0]).toMatchObject({ rowIndex: 0 })
    expect(r.errors[1]).toMatchObject({ rowIndex: 1 })
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].title).toBe('OK2')
  })

  it('rejects missing header columns', () => {
    const csv = 'title,category\nFoo,vao-10'
    const r = parseExamsCsv(csv)
    expect(r.headerError).toMatch(/missing/i)
  })
})
