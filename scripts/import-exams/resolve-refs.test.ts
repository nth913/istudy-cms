import { describe, it, expect, vi } from 'vitest'
import { resolveProvinceId, resolveSubjectId } from './resolve-refs'

describe('resolveProvinceId', () => {
  it('returns id when found', async () => {
    const payload: any = { find: vi.fn().mockResolvedValue({ docs: [{ id: 'p1' }] }) }
    expect(await resolveProvinceId(payload, 'ha-noi')).toBe('p1')
  })
  it('returns undefined when not found', async () => {
    const payload: any = { find: vi.fn().mockResolvedValue({ docs: [] }) }
    expect(await resolveProvinceId(payload, 'nope')).toBeUndefined()
  })
  it('returns undefined for empty slug', async () => {
    const payload: any = { find: vi.fn() }
    expect(await resolveProvinceId(payload, undefined)).toBeUndefined()
    expect(payload.find).not.toHaveBeenCalled()
  })
})

describe('resolveSubjectId', () => {
  it('returns id when found', async () => {
    const payload: any = { find: vi.fn().mockResolvedValue({ docs: [{ id: 's1' }] }) }
    expect(await resolveSubjectId(payload, 'toan')).toBe('s1')
  })
})
