import { describe, it, expect } from 'vitest'
import { normalize, extractPlainText, lengthScore, onPageChecks } from './analyze'

describe('normalize', () => {
  it('strips Vietnamese tones + đ and lowercases', () => {
    expect(normalize('Tiếng Anh ĐỀ')).toBe('tieng anh de')
  })
})
describe('extractPlainText', () => {
  it('collects text nodes from a Lexical tree', () => {
    const rt = { root: { children: [{ children: [{ text: 'Hello' }, { text: ' world' }] }] } }
    expect(extractPlainText(rt)).toBe('Hello world')
  })
  it('returns empty for invalid input', () => {
    expect(extractPlainText(null)).toBe('')
    expect(extractPlainText({})).toBe('')
  })
})
describe('lengthScore', () => {
  it('title ok/warn/bad', () => {
    expect(lengthScore('x'.repeat(45), 'title').status).toBe('ok')
    expect(lengthScore('x'.repeat(20), 'title').status).toBe('warn')
    expect(lengthScore('x'.repeat(80), 'title').status).toBe('bad')
    expect(lengthScore('', 'title').status).toBe('bad')
  })
  it('description ok/warn/bad', () => {
    expect(lengthScore('x'.repeat(120), 'description').status).toBe('ok')
    expect(lengthScore('x'.repeat(40), 'description').status).toBe('warn')
    expect(lengthScore('x'.repeat(250), 'description').status).toBe('bad')
  })
})
describe('onPageChecks', () => {
  const base = { title: 'Đề thi Tiếng Anh vào 10', description: 'Tổng hợp đề Tiếng Anh có đáp án chi tiết cho học sinh ôn luyện vào lớp 10 năm 2026 đầy đủ.', slug: 'de-tieng-anh-vao-10', bodyText: 'Tiếng Anh '.repeat(50), focusKeyword: 'tiếng anh' }
  it('fails + short-circuits when no keyword', () => {
    const r = onPageChecks({ ...base, focusKeyword: '' })
    expect(r.find(c => c.id === 'kw')!.status).toBe('fail')
    expect(r.length).toBe(1)
  })
  it('passes title/desc/slug diacritic-insensitive', () => {
    const r = onPageChecks(base)
    expect(r.find(c => c.id === 'title')!.status).toBe('pass')
    expect(r.find(c => c.id === 'desc')!.status).toBe('pass')
    expect(r.find(c => c.id === 'slug')!.status).toBe('pass')
  })
  it('warns body checks when bodyText empty', () => {
    const r = onPageChecks({ ...base, bodyText: '' })
    expect(r.find(c => c.id === 'body')!.status).toBe('warn')
    expect(r.find(c => c.id === 'density')!.status).toBe('warn')
  })
})
