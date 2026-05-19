import { describe, it, expect, vi } from 'vitest'
import { subjectHubEndpoint } from './hubs'

describe('subjectHubEndpoint', () => {
  it('queries exams where subject relation equals resolved subject id', async () => {
    const findMock = vi.fn()
      .mockResolvedValueOnce({ docs: [{ id: 'sub-1', name: 'Toán' }] }) // subjects find
      .mockResolvedValueOnce({ docs: [{ id: 'e1', title: 'Đề Toán' }], page: 1, totalPages: 1, totalDocs: 1 }) // exams find

    const req: any = {
      routeParams: { slug: 'toan' },
      url: 'http://localhost/api/v1/subjects/toan/exams?page=1&limit=20',
      payload: { find: findMock },
    }

    const res = await subjectHubEndpoint.handler!(req)
    const body = await (res as Response).json()

    expect(findMock).toHaveBeenCalledTimes(2)
    const examsCall = findMock.mock.calls[1][0]
    expect(examsCall.collection).toBe('exams')
    expect(JSON.stringify(examsCall.where)).toContain('"subject"')
    expect(JSON.stringify(examsCall.where)).toContain('"sub-1"')
    expect(body.items).toEqual([{ id: 'e1', title: 'Đề Toán' }])
    expect(body.note).toBeUndefined()
  })

  it('returns 404 Vietnamese when subject slug not found', async () => {
    const findMock = vi.fn().mockResolvedValueOnce({ docs: [] })
    const req: any = {
      routeParams: { slug: 'nope' },
      url: 'http://localhost/api/v1/subjects/nope/exams',
      payload: { find: findMock },
    }
    const res = await subjectHubEndpoint.handler!(req)
    expect((res as Response).status).toBe(404)
    const body = await (res as Response).json()
    expect(body.error).toMatch(/môn học/i)
  })

  it('400 when slug missing', async () => {
    const req: any = { routeParams: {}, url: 'http://localhost', payload: { find: vi.fn() } }
    const res = await subjectHubEndpoint.handler!(req)
    expect((res as Response).status).toBe(400)
  })
})
