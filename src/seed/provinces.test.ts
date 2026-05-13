import { describe, it, expect } from 'vitest'
import { PROVINCES_SEED } from './provinces'

describe('PROVINCES_SEED', () => {
  it('has 34 entries', () => {
    expect(PROVINCES_SEED).toHaveLength(34)
  })
  it('has 28 tỉnh + 6 thành-phố', () => {
    const tinh = PROVINCES_SEED.filter(p => p.type === 'tinh')
    const tp = PROVINCES_SEED.filter(p => p.type === 'thanh-pho')
    expect(tinh).toHaveLength(28)
    expect(tp).toHaveLength(6)
  })
  it('all slugs unique', () => {
    const slugs = PROVINCES_SEED.map(p => p.slug)
    expect(new Set(slugs).size).toBe(34)
  })
  it('all slugs match vietnamese-slugify convention (lowercase, hyphen-separated, no diacritics)', () => {
    for (const p of PROVINCES_SEED) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })
  it('6 thành-phố includes Hà Nội, Huế, Hải Phòng, Đà Nẵng, HCM, Cần Thơ', () => {
    const tpNames = PROVINCES_SEED.filter(p => p.type === 'thanh-pho').map(p => p.name)
    expect(tpNames).toEqual(expect.arrayContaining([
      'Hà Nội', 'Huế', 'Hải Phòng', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Cần Thơ',
    ]))
  })
})
