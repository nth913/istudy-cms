import { describe, it, expect } from 'vitest'
import { Exams } from './Exams'

function field(name: string) {
  return (Exams.fields as any[]).find((f) => f.name === name)
}

describe('Exams — exam meta fields', () => {
  it('has examDate date field (dayOnly)', () => {
    const f = field('examDate')
    expect(f).toBeDefined()
    expect(f.type).toBe('date')
    expect(f.admin?.date?.pickerAppearance).toBe('dayOnly')
  })

  it('has totalQuestions number default 40', () => {
    const f = field('totalQuestions')
    expect(f).toBeDefined()
    expect(f.type).toBe('number')
    expect(f.defaultValue).toBe(40)
  })

  it('has durationMinutes number default 60', () => {
    const f = field('durationMinutes')
    expect(f).toBeDefined()
    expect(f.type).toBe('number')
    expect(f.defaultValue).toBe(60)
  })
})
