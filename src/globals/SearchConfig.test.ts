import { describe, it, expect } from 'vitest'
import { SearchConfig } from './SearchConfig'

describe('SearchConfig', () => {
  it('has maxTagsSuggest + maxProvincesSuggest defaulting to 3', () => {
    const byName = Object.fromEntries((SearchConfig.fields as any[]).map((f) => [f.name, f]))
    expect(byName.maxTagsSuggest?.type).toBe('number')
    expect(byName.maxTagsSuggest?.defaultValue).toBe(3)
    expect(byName.maxProvincesSuggest?.defaultValue).toBe(3)
  })
})

describe('SearchConfig defaults + trending config', () => {
  const byName = Object.fromEntries((SearchConfig.fields as any[]).map((f) => [f.name, f]))
  it('renames arrays to defaultTags + defaultProvinces', () => {
    expect(byName.defaultTags?.type).toBe('array')
    expect(byName.defaultProvinces?.type).toBe('array')
    expect(byName.popularTags).toBeUndefined()
    expect(byName.provinces).toBeUndefined()
  })
  it('adds maxTrendingSuggest + loadingTimeoutMs + defaultTrending', () => {
    expect(byName.maxTrendingSuggest?.defaultValue).toBe(3)
    expect(byName.loadingTimeoutMs?.defaultValue).toBe(13000)
    expect(byName.defaultTrending?.type).toBe('array')
    const dtFields = (byName.defaultTrending.fields as any[]).map((f) => f.name)
    expect(dtFields).toEqual(expect.arrayContaining(['label', 'href', 'delta']))
  })
})
