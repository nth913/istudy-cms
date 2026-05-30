// istudy-cms/src/hooks/computeSearchKeyPost.test.ts
import { describe, expect, it } from 'vitest'
import { computeSearchKeyPost } from './computeSearchKeyPost'

describe('computeSearchKeyPost', () => {
  it('combines title + excerpt + tags into stripped lowercase', () => {
    const data = { title: 'Mẹo Đọc Hiệu Quả', excerpt: 'Tip ôn thi', tags: ['reading', 'meo'] }
    const result = computeSearchKeyPost({ data } as any)
    expect(result.searchKeyPost).toBe('meo doc hieu qua tip on thi reading meo')
  })
  it('handles missing fields gracefully', () => {
    expect(computeSearchKeyPost({ data: { title: 'Test' } } as any).searchKeyPost).toBe('test')
    expect(computeSearchKeyPost({ data: {} } as any).searchKeyPost).toBe('')
  })
})
