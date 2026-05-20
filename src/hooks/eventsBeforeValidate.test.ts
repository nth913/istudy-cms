import { describe, it, expect } from 'vitest'
import { eventsBeforeValidate } from './eventsBeforeValidate'

describe('eventsBeforeValidate — auto-tick deReady', () => {
  it('auto-ticks deReady when dapAnReady=true and deReady=false', () => {
    const data = { title: 'X', dapAnReady: true, deReady: false }
    const result = eventsBeforeValidate({ data } as any)
    expect(result.deReady).toBe(true)
  })
  it('preserves deReady=true when dapAnReady=true', () => {
    const data = { title: 'X', dapAnReady: true, deReady: true }
    const result = eventsBeforeValidate({ data } as any)
    expect(result.deReady).toBe(true)
  })
  it('does NOT tick deReady when dapAnReady=false', () => {
    const data = { title: 'X', dapAnReady: false, deReady: false }
    const result = eventsBeforeValidate({ data } as any)
    expect(result.deReady).toBe(false)
  })
})

describe('eventsBeforeValidate — default short', () => {
  it('defaults short = title when short empty and title short', () => {
    const data = { title: 'Đề thi 2026' }
    const result = eventsBeforeValidate({ data } as any)
    expect(result.short).toBe('Đề thi 2026')
  })
  it('truncates title to 37 chars + ... when title > 40 chars', () => {
    const longTitle = 'A'.repeat(50)
    const data = { title: longTitle }
    const result = eventsBeforeValidate({ data } as any)
    expect(result.short).toBe('A'.repeat(37) + '...')
    expect(result.short.length).toBe(40)
  })
  it('preserves existing short value', () => {
    const data = { title: 'Long title here', short: 'Custom' }
    const result = eventsBeforeValidate({ data } as any)
    expect(result.short).toBe('Custom')
  })
})

describe('eventsBeforeValidate — examEndTime validation', () => {
  it('throws when examEndTime < startAt', () => {
    const data = {
      title: 'X',
      startAt: '2026-06-27T07:30:00+07:00',
      examEndTime: '2026-06-27T06:00:00+07:00',
    }
    expect(() => eventsBeforeValidate({ data } as any)).toThrow('Giờ kết thúc thi phải sau giờ bắt đầu')
  })
  it('passes when examEndTime ≥ startAt', () => {
    const data = {
      title: 'X',
      startAt: '2026-06-27T07:30:00+07:00',
      examEndTime: '2026-06-27T09:30:00+07:00',
    }
    expect(() => eventsBeforeValidate({ data } as any)).not.toThrow()
  })
})

describe('eventsBeforeValidate — priority range', () => {
  it('throws when priority < 1', () => {
    const data = { title: 'X', priority: 0 }
    expect(() => eventsBeforeValidate({ data } as any)).toThrow('Priority phải trong khoảng 1-99')
  })
  it('throws when priority > 99', () => {
    const data = { title: 'X', priority: 100 }
    expect(() => eventsBeforeValidate({ data } as any)).toThrow('Priority phải trong khoảng 1-99')
  })
  it('passes when priority = 50', () => {
    const data = { title: 'X', priority: 50 }
    expect(() => eventsBeforeValidate({ data } as any)).not.toThrow()
  })
})
