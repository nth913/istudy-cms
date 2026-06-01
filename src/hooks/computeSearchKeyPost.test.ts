import { describe, it, expect, vi } from 'vitest'
import { computeSearchKeyPost } from './computeSearchKeyPost'

describe('computeSearchKeyPost', () => {
  it('includes resolved topic names, diacritic-stripped lowercase', async () => {
    const payload = { find: vi.fn(async () => ({ docs: [{ name: 'reading' }, { name: 'mẹo' }] })) }
    const data = { title: 'Mẹo Đọc Hiệu Quả', excerpt: 'Tip ôn thi', topics: ['t1', 't2'] }
    const out = await computeSearchKeyPost({ data, req: { payload } } as any)
    expect(out.searchKeyPost).toContain('reading')
    expect(out.searchKeyPost).toContain('meo')
    expect(out.searchKeyPost).toBe(out.searchKeyPost.toLowerCase())
  })
  it('handles missing topics gracefully', async () => {
    const payload = { find: vi.fn(async () => ({ docs: [] })) }
    const out = await computeSearchKeyPost({ data: { title: 'Test' }, req: { payload } } as any)
    expect(out.searchKeyPost).toBe('test')
  })
  it('handles no req.payload gracefully', async () => {
    const out = await computeSearchKeyPost({ data: { title: 'Test', topics: ['id1'] }, req: {} } as any)
    expect(out.searchKeyPost).toBe('test')
  })
})
