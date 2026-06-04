// src/seed/vao10.ts
// Seed the Vao10Config global with 34 province rows.
// IDEMPOTENT + NON-DESTRUCTIVE: existing exam/thumbnail selections are preserved.

import type { Payload } from 'payload'

/** 34 province names — single source of truth (order matters for FE). */
export const VAO10_2026_PROVINCE_NAMES = [
  'Hà Nội',
  'Hải Phòng',
  'Quảng Ninh',
  'Bắc Ninh',
  'Ninh Bình',
  'Hưng Yên',
  'Phú Thọ',
  'Thái Nguyên',
  'Lào Cai',
  'Tuyên Quang',
  'Sơn La',
  'Lạng Sơn',
  'Cao Bằng',
  'Điện Biên',
  'Lai Châu',
  'Nghệ An',
  'Thanh Hóa',
  'Đà Nẵng',
  'Huế',
  'Khánh Hòa',
  'Hà Tĩnh',
  'Lâm Đồng',
  'Đắk Lắk',
  'Gia Lai',
  'Quảng Ngãi',
  'Quảng Trị',
  'TP.HCM',
  'Đồng Nai',
  'Cần Thơ',
  'An Giang',
  'Tây Ninh',
  'Đồng Tháp',
  'Vĩnh Long',
  'Cà Mau',
] as const

export async function seedVao102026(payload: Payload): Promise<void> {
  // Read current state — depth:0 keeps relations as IDs (no over-fetching)
  const current = (await payload.findGlobal({
    slug: 'vao10-2026-config',
    depth: 0,
  })) as any

  // Build map of existing rows by provinceName (preserve exam + thumbnail)
  const existingByName = new Map<string, Record<string, unknown>>()
  for (const row of (current?.items ?? []) as Record<string, unknown>[]) {
    const name = String(row.provinceName ?? '').trim()
    if (name) existingByName.set(name, row)
  }

  // Merge: keep existing data, add missing rows as fresh stubs
  const items = VAO10_2026_PROVINCE_NAMES.map((name) => {
    const existing = existingByName.get(name)
    if (existing) {
      // Preserve editor's choices — only ensure provinceName stays correct
      return { ...existing, provinceName: name }
    }
    return { provinceName: name }
  })

  await payload.updateGlobal({
    slug: 'vao10-2026-config',
    data: { items } as any,
  })

  console.log(`✓ Vao10Config seeded: ${items.length} province rows`)
}
