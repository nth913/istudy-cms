import { describe, it, expect, vi } from 'vitest'
import { examsSidebarFacetsEndpoint } from './exams-sidebar-facets'

function makePayload({ global, exams = [] }: { global?: any; exams?: any[] }) {
  return {
    findGlobal: vi.fn(async ({ slug }: any) => global ?? null),
    find: vi.fn(async ({ collection, where }: any) => {
      if (collection === 'provinces') {
        const slug = where?.slug?.equals
        return { docs: slug === 'ha-noi' ? [{ id: 'prov-1', slug: 'ha-noi' }] : [] }
      }
      return { docs: exams, totalDocs: exams.length }
    }),
    count: vi.fn(async ({ collection, where }: any) => {
      let filtered = exams.filter((e) => e._status === 'published')
      if (where?.category?.equals) filtered = filtered.filter((e) => e.category === where.category.equals)
      return { totalDocs: filtered.length }
    }),
  }
}

async function callEndpoint(payload: any, url = 'http://localhost/api/exams/sidebar-facets') {
  const handler = (examsSidebarFacetsEndpoint as any).handler
  const req: any = { payload, url, method: 'GET' }
  const res = await handler(req)
  const body = await res.json()
  return { status: res.status ?? 200, body }
}

describe('exams-sidebar-facets endpoint', () => {
  it('returns empty groups when config not set', async () => {
    const payload = makePayload({ global: null })
    const { body } = await callEndpoint(payload)
    expect(body.groups).toEqual([])
  })

  it('uses countOverride when set', async () => {
    const payload = makePayload({
      global: {
        groups: [{
          title: 'X',
          items: [{ label: 'A', filterQuery: '?cat=vao-10', countOverride: 99 }],
        }],
      },
    })
    const { body } = await callEndpoint(payload)
    expect(body.groups[0].items[0].count).toBe(99)
  })

  it('aggregates real count when countOverride null', async () => {
    const payload = makePayload({
      global: {
        groups: [{
          title: 'X',
          items: [{ label: 'Vào 10', filterQuery: '?cat=vao-10', countOverride: null }],
        }],
      },
      exams: [
        { slug: 'a', category: 'vao-10', _status: 'published' },
        { slug: 'b', category: 'vao-10', _status: 'published' },
        { slug: 'c', category: 'vao-dai-hoc', _status: 'published' },
      ],
    })
    const { body } = await callEndpoint(payload)
    expect(body.groups[0].items[0].count).toBe(2)
  })

  it('handles malformed filterQuery gracefully (count=0)', async () => {
    const payload = makePayload({
      global: {
        groups: [{
          title: 'X',
          items: [{ label: 'Broken', filterQuery: 'invalid', countOverride: null }],
        }],
      },
    })
    const { body } = await callEndpoint(payload)
    expect(body.groups[0].items[0].count).toBe(0)
  })
})
