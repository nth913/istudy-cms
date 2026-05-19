import { describe, it, expect, vi } from 'vitest'
import { upsertExam } from './upsert-exam'

describe('upsertExam', () => {
  it('creates new exam when slug not found', async () => {
    const payload: any = {
      find: vi.fn().mockResolvedValue({ docs: [] }),
      create: vi.fn().mockResolvedValue({ id: 'e1', slug: 'de-toan' }),
      update: vi.fn(),
    }
    const result = await upsertExam(payload, {
      title: 'Đề Toán',
      slug: 'de-toan',
      category: 'vao-10',
      examType: 'chinh-thuc',
      year: '2024',
      pdfFileId: 'm1',
    })
    expect(result.status).toBe('created')
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'exams',
      data: expect.objectContaining({ slug: 'de-toan', _status: 'draft', pdfFile: 'm1' }),
    })
  })

  it('updates exam when slug exists', async () => {
    const payload: any = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: 'existing', slug: 'de-toan' }] }),
      update: vi.fn().mockResolvedValue({ id: 'existing' }),
      create: vi.fn(),
    }
    const result = await upsertExam(payload, {
      title: 'Đề Toán v2',
      slug: 'de-toan',
      category: 'vao-10',
      examType: 'chinh-thuc',
      year: '2024',
      pdfFileId: 'm2',
    })
    expect(result.status).toBe('updated')
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'exams',
      id: 'existing',
      data: expect.objectContaining({ title: 'Đề Toán v2', pdfFile: 'm2' }),
    })
  })

  it('never sets _status=published', async () => {
    const payload: any = {
      find: vi.fn().mockResolvedValue({ docs: [] }),
      create: vi.fn().mockResolvedValue({ id: 'e1' }),
    }
    await upsertExam(payload, {
      title: 'X', slug: 'x', category: 'vao-10', examType: 'chinh-thuc', year: '2024', pdfFileId: 'm',
    })
    const data = payload.create.mock.calls[0][0].data
    expect(data._status).toBe('draft')
  })
})
