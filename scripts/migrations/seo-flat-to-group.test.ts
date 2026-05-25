import { describe, it, expect, vi } from 'vitest'
import { migrateSeoFlatToGroup, type MigrationDeps } from './seo-flat-to-group'

const buildDeps = (overrides: Partial<MigrationDeps> = {}): MigrationDeps => ({
  findDocs: vi.fn().mockResolvedValue([]),
  updateGroupField: vi.fn().mockResolvedValue(undefined),
  unsetFlatFields: vi.fn().mockResolvedValue(undefined),
  logger: { info: vi.fn(), warn: vi.fn() },
  ...overrides,
})

describe('migrateSeoFlatToGroup', () => {
  it('migrates Posts doc flat → group + unsets flat fields', async () => {
    const docs = [{ id: 'p1', seoTitle: 'T1', seoDescription: 'D1', ogImage: 'media-1' }]
    const deps = buildDeps({ findDocs: vi.fn().mockResolvedValue(docs) })
    await migrateSeoFlatToGroup(deps, { collection: 'posts' })
    expect(deps.updateGroupField).toHaveBeenCalledWith({
      collection: 'posts', id: 'p1',
      seo: { title: 'T1', description: 'D1', ogImage: 'media-1', ogTitle: null, ogDescription: null },
    })
    expect(deps.unsetFlatFields).toHaveBeenCalledWith({
      collection: 'posts', id: 'p1',
      fields: ['seoTitle', 'seoDescription', 'ogImage'],
    })
  })

  it('migrates Books doc (no ogImage flat) → group ogImage null', async () => {
    const docs = [{ id: 'b1', seoTitle: 'BT', seoDescription: 'BD' }]
    const deps = buildDeps({ findDocs: vi.fn().mockResolvedValue(docs) })
    await migrateSeoFlatToGroup(deps, { collection: 'books' })
    expect(deps.updateGroupField).toHaveBeenCalledWith({
      collection: 'books', id: 'b1',
      seo: { title: 'BT', description: 'BD', ogImage: null, ogTitle: null, ogDescription: null },
    })
    expect(deps.unsetFlatFields).toHaveBeenCalledWith({
      collection: 'books', id: 'b1',
      fields: ['seoTitle', 'seoDescription'],
    })
  })

  it('idempotent: skip nếu doc.seo.title đã set', async () => {
    const docs = [{ id: 'p1', seo: { title: 'X' }, seoTitle: 'old' }]
    const deps = buildDeps({ findDocs: vi.fn().mockResolvedValue(docs) })
    await migrateSeoFlatToGroup(deps, { collection: 'posts' })
    expect(deps.updateGroupField).not.toHaveBeenCalled()
    expect(deps.unsetFlatFields).not.toHaveBeenCalled()
  })

  it('handles empty result: no-op', async () => {
    const deps = buildDeps({ findDocs: vi.fn().mockResolvedValue([]) })
    await migrateSeoFlatToGroup(deps, { collection: 'posts' })
    expect(deps.updateGroupField).not.toHaveBeenCalled()
  })

  it('throws if collection không phải posts hoặc books', async () => {
    const deps = buildDeps()
    await expect(
      migrateSeoFlatToGroup(deps, { collection: 'exams' as any })
    ).rejects.toThrow(/posts|books/)
  })
})
