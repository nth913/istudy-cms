import { describe, it, expect, vi } from 'vitest'
import { buildVao10Response, vao102026Endpoint } from './vao10-2026'
import { normProvinceKey } from '../lib/vao10-key'

// ── helpers ───────────────────────────────────────────────────────────────────

const SERVER = 'https://cms.example.com'

const makeMedia = (url: string, cardUrl?: string) => ({
  url,
  sizes: cardUrl ? { card: { url: cardUrl } } : undefined,
})

const makeExam = (slug: string, status: 'published' | 'draft', title = 'Exam Title') => ({
  slug,
  title,
  _status: status,
})

// ── normProvinceKey ───────────────────────────────────────────────────────────

describe('normProvinceKey', () => {
  it('lowercases and strips diacritics', () => {
    expect(normProvinceKey('Hà Nội')).toBe('ha noi')
    expect(normProvinceKey('TP.HCM')).toBe('tp.hcm')
    expect(normProvinceKey('Đà Nẵng')).toBe('da nang')
    expect(normProvinceKey('Cà Mau')).toBe('ca mau')
  })

  it('handles null / undefined gracefully', () => {
    expect(normProvinceKey(null)).toBe('')
    expect(normProvinceKey(undefined)).toBe('')
  })
})

// ── buildVao10Response ────────────────────────────────────────────────────────

describe('buildVao10Response', () => {
  it('returns empty items when global is null', () => {
    const res = buildVao10Response(null, SERVER)
    expect(res.items).toEqual([])
    expect(typeof res.updatedAt).toBe('string')
  })

  it('returns empty items when global has no items array', () => {
    const res = buildVao10Response({}, SERVER)
    expect(res.items).toEqual([])
  })

  it('published exam → slug present + examTitle', () => {
    const global = {
      updatedAt: '2026-06-01T00:00:00Z',
      items: [
        { provinceName: 'Hà Nội', exam: makeExam('vao-10-ha-noi-2026', 'published') },
      ],
    }
    const res = buildVao10Response(global, SERVER)
    expect(res.items).toHaveLength(1)
    expect(res.items[0].slug).toBe('vao-10-ha-noi-2026')
    expect(res.items[0].examTitle).toBe('Exam Title')
    expect(res.items[0].key).toBe('ha noi')
  })

  it('draft exam → slug is null', () => {
    const global = {
      items: [
        { provinceName: 'Hải Phòng', exam: makeExam('vao-10-hai-phong-2026', 'draft') },
      ],
    }
    const res = buildVao10Response(global, SERVER)
    expect(res.items[0].slug).toBeNull()
    // không leak title của đề draft qua public endpoint
    expect(res.items[0].examTitle).toBeNull()
  })

  it('missing exam (null/undefined) → slug null + examTitle null', () => {
    const global = {
      items: [
        { provinceName: 'Quảng Ninh', exam: null },
        { provinceName: 'Bắc Ninh' },
      ],
    }
    const res = buildVao10Response(global, SERVER)
    expect(res.items[0].slug).toBeNull()
    expect(res.items[0].examTitle).toBeNull()
    expect(res.items[1].slug).toBeNull()
    expect(res.items[1].examTitle).toBeNull()
  })

  it('thumbnail with card size url → thumbnailUrl uses card url', () => {
    const global = {
      items: [
        {
          provinceName: 'Ninh Bình',
          exam: null,
          thumbnail: makeMedia(
            '/media/thumb-full.webp',
            '/media/thumb-card.webp',
          ),
        },
      ],
    }
    const res = buildVao10Response(global, SERVER)
    expect(res.items[0].thumbnailUrl).toBe(
      `${SERVER}/media/thumb-card.webp`,
    )
  })

  it('thumbnail relative url (no card size) → prepend serverUrl', () => {
    const global = {
      items: [
        {
          provinceName: 'Hưng Yên',
          thumbnail: makeMedia('/media/thumb.webp'),
        },
      ],
    }
    const res = buildVao10Response(global, SERVER)
    expect(res.items[0].thumbnailUrl).toBe(`${SERVER}/media/thumb.webp`)
  })

  it('thumbnail absolute url → used as-is', () => {
    const absUrl = 'https://cdn.r2.example.com/media/thumb.webp'
    const global = {
      items: [
        {
          provinceName: 'Phú Thọ',
          thumbnail: makeMedia(absUrl),
        },
      ],
    }
    const res = buildVao10Response(global, SERVER)
    expect(res.items[0].thumbnailUrl).toBe(absUrl)
  })

  it('no thumbnail → thumbnailUrl is null', () => {
    const global = {
      items: [{ provinceName: 'Thái Nguyên' }],
    }
    const res = buildVao10Response(global, SERVER)
    expect(res.items[0].thumbnailUrl).toBeNull()
  })

  it('key is normProvinceKey(provinceName)', () => {
    const global = {
      items: [
        { provinceName: 'Đà Nẵng' },
        { provinceName: 'TP.HCM' },
        { provinceName: 'Lào Cai' },
      ],
    }
    const res = buildVao10Response(global, SERVER)
    expect(res.items[0].key).toBe(normProvinceKey('Đà Nẵng'))
    expect(res.items[1].key).toBe(normProvinceKey('TP.HCM'))
    expect(res.items[2].key).toBe(normProvinceKey('Lào Cai'))
  })

  it('updatedAt comes from global.updatedAt when present', () => {
    const global = { updatedAt: '2026-06-04T12:00:00Z', items: [] }
    const res = buildVao10Response(global, SERVER)
    expect(res.updatedAt).toBe('2026-06-04T12:00:00Z')
  })

  it('updatedAt falls back to current ISO string when missing', () => {
    const before = Date.now()
    const res = buildVao10Response({}, SERVER)
    const after = Date.now()
    const ts = new Date(res.updatedAt).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })
})

// ── endpoint handler ──────────────────────────────────────────────────────────

describe('vao102026Endpoint handler', () => {
  it('calls findGlobal with depth:1 and returns JSON 200', async () => {
    const findGlobal = vi.fn(async () => ({
      updatedAt: '2026-06-01T00:00:00Z',
      items: [
        {
          provinceName: 'Hà Nội',
          exam: makeExam('vao-10-ha-noi-2026', 'published', 'Đề Hà Nội 2026'),
        },
      ],
    }))
    const req = { payload: { findGlobal } } as any
    const handler = (vao102026Endpoint as any).handler
    const response: Response = await handler(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items).toHaveLength(1)
    expect(body.items[0].slug).toBe('vao-10-ha-noi-2026')
    expect(body.items[0].key).toBe('ha noi')
    expect(findGlobal).toHaveBeenCalledWith({
      slug: 'vao10-2026-config',
      depth: 1,
    })
    expect(response.headers.get('Cache-Control')).toContain('max-age=60')
  })

  it('returns graceful 200 empty items when findGlobal throws', async () => {
    const req = {
      payload: {
        findGlobal: vi.fn(async () => {
          throw new Error('mongo down')
        }),
      },
    } as any
    const handler = (vao102026Endpoint as any).handler
    const response: Response = await handler(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items).toEqual([])
    expect(typeof body.updatedAt).toBe('string')
  })
})
