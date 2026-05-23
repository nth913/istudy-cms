import { describe, it, expect } from 'vitest'
import { validateFilterQuery } from './KhoDeSidebarConfig'

describe('validateFilterQuery', () => {
  it('accepts ?cat=vao-10', () => {
    expect(validateFilterQuery('?cat=vao-10')).toBe(true)
  })
  it('accepts multi-param ?cat=vao-10&province=ha-noi', () => {
    expect(validateFilterQuery('?cat=vao-10&province=ha-noi')).toBe(true)
  })
  it('rejects missing leading ?', () => {
    expect(validateFilterQuery('cat=vao-10')).toBe('Phải bắt đầu bằng ? và đúng định dạng ?key=value')
  })
  it('rejects empty string', () => {
    expect(validateFilterQuery('')).toBe('Phải bắt đầu bằng ? và đúng định dạng ?key=value')
  })
  it('rejects uppercase', () => {
    expect(validateFilterQuery('?CAT=vao-10')).toBe('Phải bắt đầu bằng ? và đúng định dạng ?key=value')
  })
})
