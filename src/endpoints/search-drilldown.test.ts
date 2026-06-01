import { describe, it, expect, vi } from 'vitest'
import { searchDrilldownEndpoint } from './search-drilldown'

function makeReq(url: string, find: any, count?: any) {
  return { url, payload: { find: vi.fn().mockResolvedValue(find), count: vi.fn().mockResolvedValue(count ?? { totalDocs: 0 }) } } as any
}
const examDoc = { id: 'e1', slug: 'de-2025', title: 'Đề 2025', category: 'vao-dai-hoc', examType: 'minh-hoa', year: '2025', dapAnReady: true }

describe('searchDrilldownEndpoint', () => {
  it('400 on invalid cat', async () => {
    const res = await searchDrilldownEndpoint.handler(makeReq('/api/search-drilldown?cat=nope', { docs: [], totalDocs: 0, hasNextPage: false }))
    expect(res.status).toBe(400)
  })
  it('thpt → uniform items + total + hasMore', async () => {
    const req = makeReq('/api/search-drilldown?cat=thpt&q=de&limit=20&offset=0', { docs: [examDoc], totalDocs: 1, hasNextPage: false })
    const body = await (await searchDrilldownEndpoint.handler(req)).json()
    expect(req.payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'exams', sort: '-year' }))
    expect(body).toMatchObject({ total: 1, hasMore: false })
    expect(body.items[0]).toMatchObject({ id: 'e1', cat: 'thpt', year: '2025' })
  })
  it('sort=oldest → +year', async () => {
    const req = makeReq('/api/search-drilldown?cat=l10&sort=oldest', { docs: [], totalDocs: 0, hasNextPage: false })
    await searchDrilldownEndpoint.handler(req)
    expect(req.payload.find).toHaveBeenCalledWith(expect.objectContaining({ sort: 'year' }))
  })
  it('facets=year returns year buckets (exams)', async () => {
    const req = makeReq('/api/search-drilldown?cat=thpt&facets=year', { docs: [], totalDocs: 0, hasNextPage: false }, { totalDocs: 3 })
    const body = await (await searchDrilldownEndpoint.handler(req)).json()
    expect(body.facets.years.every((y: any) => y.count === 3)).toBe(true)
  })
})
