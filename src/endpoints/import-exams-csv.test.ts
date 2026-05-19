import { describe, it, expect, vi } from 'vitest'
import { importExamsCsvEndpoint } from './import-exams-csv'

const csv = [
  'title,slug,category,examType,year,subjectSlug,provinceSlug,school,pdfFileName,answerFileName',
  'Đề Toán,,vao-10,chinh-thuc,2024,toan,ha-noi,,de1.pdf,',
].join('\n')

const fakeReq = (overrides: any = {}): any => ({
  user: { role: 'admin' },
  json: async () => ({ csv, files: [{ name: 'de1.pdf', base64: Buffer.from('pdf-bytes').toString('base64') }] }),
  payload: {
    find: vi.fn()
      .mockResolvedValueOnce({ docs: [] }) // media checksum lookup (no match)
      .mockResolvedValueOnce({ docs: [{ id: 'sub-1' }] }) // subjectId
      .mockResolvedValueOnce({ docs: [{ id: 'prov-1' }] }) // provinceId
      .mockResolvedValueOnce({ docs: [] }), // exam slug lookup
    create: vi.fn()
      .mockResolvedValueOnce({ id: 'm1' }) // media create
      .mockResolvedValueOnce({ id: 'e1' }), // exam create
    update: vi.fn(),
  },
  ...overrides,
})

describe('importExamsCsvEndpoint', () => {
  it('rejects non-admin', async () => {
    const req = fakeReq({ user: { role: 'viewer' } })
    const res = await importExamsCsvEndpoint.handler!(req)
    expect((res as Response).status).toBe(403)
  })

  it('creates exam from valid csv + uploaded pdf', async () => {
    const req = fakeReq()
    const res = await importExamsCsvEndpoint.handler!(req)
    const body = await (res as Response).json()
    expect(body.summary.created).toBe(1)
    expect(body.summary.errors).toBe(0)
    expect(req.payload.create).toHaveBeenCalledTimes(2) // media + exam
  })

  it('returns 400 on header error', async () => {
    const badReq = fakeReq({ json: async () => ({ csv: 'title,category\nFoo,vao-10', files: [] }) })
    const res = await importExamsCsvEndpoint.handler!(badReq)
    expect((res as Response).status).toBe(400)
  })

  it('reports per-row error when pdf file missing', async () => {
    const req = fakeReq({
      json: async () => ({ csv, files: [] }), // no matching pdf
    })
    const res = await importExamsCsvEndpoint.handler!(req)
    const body = await (res as Response).json()
    expect(body.summary.errors).toBe(1)
    expect(body.log[0]).toMatchObject({ status: 'error' })
  })
})
