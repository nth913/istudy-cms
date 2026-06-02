import { describe, it, expect, vi } from 'vitest'
import { examsSidebarFacetsEndpoint } from './exams-sidebar-facets'

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------
function makePayload({
  examDocs = [],
  provinceDocs = [],
}: {
  examDocs?: Array<{ category?: string; year?: string | null; province?: string | null }>
  provinceDocs?: Array<{ id: string; name: string; slug: string }>
}) {
  return {
    find: vi.fn(async ({ collection, where, pagination, depth }: any) => {
      if (collection === 'exams') {
        return { docs: examDocs }
      }
      if (collection === 'provinces') {
        // where.id.in is an array of province ids to resolve
        const ids: string[] = where?.id?.in ?? []
        return { docs: provinceDocs.filter((p) => ids.includes(p.id)) }
      }
      return { docs: [] }
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('exams-sidebar-facets endpoint (dynamic)', () => {
  // ----- Empty data --------------------------------------------------------
  it('returns empty groups when there are no exams', async () => {
    const payload = makePayload({ examDocs: [], provinceDocs: [] })
    const { body } = await callEndpoint(payload)
    expect(body.groups).toEqual([])
  })

  // ----- Response shape ----------------------------------------------------
  it('response has correct shape { groups: [{ title, items }] }', async () => {
    const payload = makePayload({
      examDocs: [{ category: 'vao-10', year: '2024', province: 'p1' }],
      provinceDocs: [{ id: 'p1', name: 'Hà Nội', slug: 'ha-noi' }],
    })
    const { body } = await callEndpoint(payload)
    expect(body).toHaveProperty('groups')
    expect(Array.isArray(body.groups)).toBe(true)
    for (const g of body.groups) {
      expect(g).toHaveProperty('title')
      expect(g).toHaveProperty('items')
      for (const item of g.items) {
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('filterQuery')
        expect(item).toHaveProperty('count')
      }
    }
  })

  // ----- Category group ----------------------------------------------------
  it('counts categories correctly and uses correct labels', async () => {
    const payload = makePayload({
      examDocs: [
        { category: 'vao-10', year: '2024', province: null },
        { category: 'vao-10', year: '2023', province: null },
        { category: 'vao-dai-hoc', year: '2024', province: null },
      ],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    const catGroup = body.groups.find((g: any) => g.title === 'Phân loại')
    expect(catGroup).toBeDefined()
    const vao10 = catGroup.items.find((i: any) => i.filterQuery === '?cat=vao-10')
    const vaoDh = catGroup.items.find((i: any) => i.filterQuery === '?cat=vao-dai-hoc')
    expect(vao10).toMatchObject({ label: 'Vào lớp 10', count: 2 })
    expect(vaoDh).toMatchObject({ label: 'Thi THPT', count: 1 })
  })

  it('vao-10 appears before vao-dai-hoc in Phân loại group', async () => {
    const payload = makePayload({
      examDocs: [
        { category: 'vao-dai-hoc', year: '2024', province: null },
        { category: 'vao-10', year: '2024', province: null },
      ],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    const catGroup = body.groups.find((g: any) => g.title === 'Phân loại')
    expect(catGroup.items[0].filterQuery).toBe('?cat=vao-10')
    expect(catGroup.items[1].filterQuery).toBe('?cat=vao-dai-hoc')
  })

  it('category with 0 exams does NOT appear in Phân loại group', async () => {
    // Only vao-10 exams exist; vao-dai-hoc has no data
    const payload = makePayload({
      examDocs: [{ category: 'vao-10', year: '2024', province: null }],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    const catGroup = body.groups.find((g: any) => g.title === 'Phân loại')
    expect(catGroup).toBeDefined()
    const labels = catGroup.items.map((i: any) => i.filterQuery)
    expect(labels).not.toContain('?cat=vao-dai-hoc')
  })

  it('Phân loại group absent when no categories present', async () => {
    // Exams with no category field
    const payload = makePayload({
      examDocs: [{ year: '2024', province: null }],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    const catGroup = body.groups.find((g: any) => g.title === 'Phân loại')
    expect(catGroup).toBeUndefined()
  })

  // ----- Province group ----------------------------------------------------
  it('province with ≥1 exam appears in Tỉnh / Thành phố group with correct count', async () => {
    const payload = makePayload({
      examDocs: [
        { category: 'vao-10', year: '2024', province: 'p1' },
        { category: 'vao-10', year: '2023', province: 'p1' },
        { category: 'vao-10', year: '2024', province: 'p2' },
      ],
      provinceDocs: [
        { id: 'p1', name: 'Hà Nội', slug: 'ha-noi' },
        { id: 'p2', name: 'TP. Hồ Chí Minh', slug: 'tp-ho-chi-minh' },
      ],
    })
    const { body } = await callEndpoint(payload)
    const provGroup = body.groups.find((g: any) => g.title === 'Tỉnh / Thành phố')
    expect(provGroup).toBeDefined()
    const haNoi = provGroup.items.find((i: any) => i.filterQuery === '?province=ha-noi')
    const hcm = provGroup.items.find((i: any) => i.filterQuery === '?province=tp-ho-chi-minh')
    expect(haNoi).toMatchObject({ label: 'Hà Nội', count: 2 })
    expect(hcm).toMatchObject({ label: 'TP. Hồ Chí Minh', count: 1 })
  })

  it('province with 0 exams does NOT appear in Tỉnh / Thành phố group', async () => {
    // p2 is in provincesDocs but has no exams
    const payload = makePayload({
      examDocs: [{ category: 'vao-10', year: '2024', province: 'p1' }],
      provinceDocs: [
        { id: 'p1', name: 'Hà Nội', slug: 'ha-noi' },
        { id: 'p2', name: 'Đà Nẵng', slug: 'da-nang' },
      ],
    })
    const { body } = await callEndpoint(payload)
    const provGroup = body.groups.find((g: any) => g.title === 'Tỉnh / Thành phố')
    expect(provGroup).toBeDefined()
    const slugs = provGroup.items.map((i: any) => i.filterQuery)
    expect(slugs).not.toContain('?province=da-nang')
  })

  it('provinces sorted by count desc, tie-break name asc', async () => {
    const payload = makePayload({
      examDocs: [
        { province: 'p1' }, // Hà Nội: 1
        { province: 'p2' }, { province: 'p2' }, { province: 'p2' }, // TP.HCM: 3
        { province: 'p3' }, { province: 'p3' }, // Cần Thơ: 2
        { province: 'p4' }, { province: 'p4' }, // An Giang: 2 (tie with p3, alpha earlier)
      ],
      provinceDocs: [
        { id: 'p1', name: 'Hà Nội', slug: 'ha-noi' },
        { id: 'p2', name: 'TP. Hồ Chí Minh', slug: 'tp-ho-chi-minh' },
        { id: 'p3', name: 'Cần Thơ', slug: 'can-tho' },
        { id: 'p4', name: 'An Giang', slug: 'an-giang' },
      ],
    })
    const { body } = await callEndpoint(payload)
    const provGroup = body.groups.find((g: any) => g.title === 'Tỉnh / Thành phố')
    const names = provGroup.items.map((i: any) => i.label)
    // TP.HCM(3) > An Giang(2) < Cần Thơ(2) alphabetically → An Giang before Cần Thơ > Hà Nội(1)
    expect(names[0]).toBe('TP. Hồ Chí Minh')
    expect(names[1]).toBe('An Giang') // tie at 2, 'An Giang' < 'Cần Thơ'
    expect(names[2]).toBe('Cần Thơ')
    expect(names[3]).toBe('Hà Nội')
  })

  it('province with null/undefined is skipped (not counted)', async () => {
    const payload = makePayload({
      examDocs: [
        { province: null },
        { province: undefined },
        { province: 'p1' },
      ],
      provinceDocs: [{ id: 'p1', name: 'Hà Nội', slug: 'ha-noi' }],
    })
    const { body } = await callEndpoint(payload)
    const provGroup = body.groups.find((g: any) => g.title === 'Tỉnh / Thành phố')
    expect(provGroup.items).toHaveLength(1)
    expect(provGroup.items[0].count).toBe(1)
  })

  it('Tỉnh / Thành phố group absent when no exams have a province', async () => {
    const payload = makePayload({
      examDocs: [{ category: 'vao-10', year: '2024', province: null }],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    const provGroup = body.groups.find((g: any) => g.title === 'Tỉnh / Thành phố')
    expect(provGroup).toBeUndefined()
  })

  it('does NOT query provinces when no province ids collected', async () => {
    const payload = makePayload({
      examDocs: [{ category: 'vao-10', year: '2024', province: null }],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    // provinces find should not have been called
    const calls = payload.find.mock.calls.filter((c: any) => c[0].collection === 'provinces')
    expect(calls).toHaveLength(0)
  })

  // ----- Year group --------------------------------------------------------
  it('counts years correctly and uses label "Năm <year>"', async () => {
    const payload = makePayload({
      examDocs: [
        { category: 'vao-10', year: '2024', province: null },
        { category: 'vao-10', year: '2024', province: null },
        { category: 'vao-10', year: '2023', province: null },
      ],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    const yearGroup = body.groups.find((g: any) => g.title === 'Năm thi')
    expect(yearGroup).toBeDefined()
    const y2024 = yearGroup.items.find((i: any) => i.filterQuery === '?year=2024')
    const y2023 = yearGroup.items.find((i: any) => i.filterQuery === '?year=2023')
    expect(y2024).toMatchObject({ label: 'Năm 2024', count: 2 })
    expect(y2023).toMatchObject({ label: 'Năm 2023', count: 1 })
  })

  it('years sorted descending (newest first)', async () => {
    const payload = makePayload({
      examDocs: [
        { year: '2022', province: null },
        { year: '2024', province: null },
        { year: '2023', province: null },
      ],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    const yearGroup = body.groups.find((g: any) => g.title === 'Năm thi')
    const years = yearGroup.items.map((i: any) => i.filterQuery)
    expect(years).toEqual(['?year=2024', '?year=2023', '?year=2022'])
  })

  it('falsy year values are skipped', async () => {
    const payload = makePayload({
      examDocs: [
        { year: null, province: null },
        { year: '', province: null },
        { year: undefined, province: null },
        { year: '2024', province: null },
      ],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    const yearGroup = body.groups.find((g: any) => g.title === 'Năm thi')
    expect(yearGroup).toBeDefined()
    expect(yearGroup.items).toHaveLength(1)
    expect(yearGroup.items[0].filterQuery).toBe('?year=2024')
  })

  it('Năm thi group absent when no exams have a year', async () => {
    const payload = makePayload({
      examDocs: [{ category: 'vao-10', year: null, province: null }],
      provinceDocs: [],
    })
    const { body } = await callEndpoint(payload)
    const yearGroup = body.groups.find((g: any) => g.title === 'Năm thi')
    expect(yearGroup).toBeUndefined()
  })

  // ----- No global read ----------------------------------------------------
  it('does NOT call findGlobal (no longer reads kho_de_sidebar_config)', async () => {
    const payload = {
      ...makePayload({ examDocs: [], provinceDocs: [] }),
      findGlobal: vi.fn(),
    }
    await callEndpoint(payload)
    expect(payload.findGlobal).not.toHaveBeenCalled()
  })
})
