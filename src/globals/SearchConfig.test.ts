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
