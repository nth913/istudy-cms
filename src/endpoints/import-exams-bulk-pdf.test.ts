import { describe, it, expect, vi } from 'vitest'
import { importExamsBulkPdfEndpoint } from './import-exams-bulk-pdf'

const fakeReq = (files: any[], role = 'admin'): any => ({
  user: { role },
  json: async () => ({ files }),
  payload: {
    find: vi.fn()
      .mockResolvedValueOnce({ docs: [] }) // media checksum
      .mockResolvedValueOnce({ docs: [{ id: 'sub-1' }] }) // subject
      .mockResolvedValueOnce({ docs: [] }) // province (none for vao-10 5-token)
      .mockResolvedValueOnce({ docs: [] }), // exam slug
    create: vi.fn()
      .mockResolvedValueOnce({ id: 'm1' }) // media
      .mockResolvedValueOnce({ id: 'e1' }), // exam
    update: vi.fn(),
  },
})

describe('importExamsBulkPdfEndpoint', () => {
  it('rejects non-admin', async () => {
    const req = fakeReq([], 'viewer')
    const res = await importExamsBulkPdfEndpoint.handler!(req)
    expect((res as Response).status).toBe(403)
  })

  it('parses filename + creates exam', async () => {
    const req = fakeReq([
      { name: 'vao-10__toan__2024__chinh-thuc__de-vao-10-toan-ha-noi.pdf', base64: Buffer.from('x').toString('base64') },
    ])
    const res = await importExamsBulkPdfEndpoint.handler!(req)
    const body = await (res as Response).json()
    expect(body.summary.created).toBe(1)
    expect(body.log[0].slug).toMatch(/de-vao-10-toan/)
  })

  it('reports filename parse error', async () => {
    const req = fakeReq([
      { name: 'bad-name.pdf', base64: 'eA==' },
    ])
    const res = await importExamsBulkPdfEndpoint.handler!(req)
    const body = await (res as Response).json()
    expect(body.summary.errors).toBe(1)
    expect(body.log[0].status).toBe('error')
  })
})
