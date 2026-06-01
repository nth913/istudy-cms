import { describe, it, expect, vi } from 'vitest'
import { topicNames, topicNamesFromIds } from './topic-names'

describe('topicNames', () => {
  it('reads names from populated topic objects', () => {
    expect(topicNames([{ id: '1', name: 'A' }, { id: '2', name: 'B' }])).toEqual(['A', 'B'])
  })
  it('returns [] for empty/undefined', () => {
    expect(topicNames(undefined)).toEqual([])
  })
})

describe('topicNamesFromIds', () => {
  it('resolves id strings to names via payload', async () => {
    const payload = { find: vi.fn(async () => ({ docs: [{ id: 'x', name: 'Hot' }] })) }
    expect(await topicNamesFromIds(payload as any, ['x'])).toEqual(['Hot'])
  })
  it('skips lookup when no ids', async () => {
    const payload = { find: vi.fn() }
    expect(await topicNamesFromIds(payload as any, [])).toEqual([])
    expect(payload.find).not.toHaveBeenCalled()
  })
})
