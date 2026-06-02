import { describe, it, expect } from 'vitest'
import { buildSuggestMessages, SUGGEST_JSON_SCHEMA, parseSuggestion } from './suggest'

describe('buildSuggestMessages', () => {
  it('embeds title + excerpt and truncates body to 1500 chars', () => {
    const { system, user } = buildSuggestMessages({ title: 'Đề Anh vào 10', excerpt: 'tóm tắt', bodyText: 'x'.repeat(3000), collection: 'posts' })
    expect(system).toMatch(/SEO/i)
    expect(user).toContain('Đề Anh vào 10')
    expect(user).toContain('tóm tắt')
    // body truncated: total user length well under 3000 + headers
    expect(user.length).toBeLessThan(2200)
  })
})
describe('SUGGEST_JSON_SCHEMA', () => {
  it('locks shape', () => {
    expect(SUGGEST_JSON_SCHEMA.additionalProperties).toBe(false)
    expect(SUGGEST_JSON_SCHEMA.required).toEqual(['title', 'description', 'ogTitle', 'focusKeyword'])
  })
})
describe('parseSuggestion', () => {
  it('parses valid JSON', () => {
    const r = parseSuggestion(JSON.stringify({ title: 'a', description: 'b', ogTitle: 'c', focusKeyword: 'd' }))
    expect(r).toEqual({ title: 'a', description: 'b', ogTitle: 'c', focusKeyword: 'd' })
  })
  it('throws on malformed JSON', () => {
    expect(() => parseSuggestion('not json')).toThrow()
  })
  it('throws when a key is missing', () => {
    expect(() => parseSuggestion(JSON.stringify({ title: 'a' }))).toThrow()
  })
})
