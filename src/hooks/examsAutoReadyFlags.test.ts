import { describe, it, expect } from 'vitest'
import { examsAutoReadyFlags } from './examsAutoReadyFlags'

describe('examsAutoReadyFlags', () => {
  it('set deReady=true when pdfFile present', () => {
    const data = { pdfFile: 'media-id-123' } as any
    const result = examsAutoReadyFlags({ data, operation: 'create' } as any)
    expect(result?.deReady).toBe(true)
  })

  it('set deReady=false when pdfFile absent', () => {
    const data = { pdfFile: null } as any
    const result = examsAutoReadyFlags({ data, operation: 'create' } as any)
    expect(result?.deReady).toBe(false)
  })

  it('set dapAnReady=true when answerFile present', () => {
    const data = { answerFile: 'media-id-456' } as any
    const result = examsAutoReadyFlags({ data, operation: 'update' } as any)
    expect(result?.dapAnReady).toBe(true)
  })

  it('set both flags independently', () => {
    const data = { pdfFile: 'a', answerFile: null } as any
    const result = examsAutoReadyFlags({ data, operation: 'update' } as any)
    expect(result?.deReady).toBe(true)
    expect(result?.dapAnReady).toBe(false)
  })

  it('returns data object with flags injected', () => {
    const data = { title: 'X', pdfFile: 'a' } as any
    const result = examsAutoReadyFlags({ data, operation: 'create' } as any)
    expect(result?.title).toBe('X')
    expect(result?.deReady).toBe(true)
  })
})
