// src/lib/vao10-key.ts
// Shared province key normalizer — used by endpoint + tests.
// IMPORTANT: do NOT modify this function; FE (istudy-web lib/vao10/provinces.ts
// norm()) dùng đúng cùng logic. `\p{Diacritic}` sau NFD tương đương [̀-ͯ]
// cho tiếng Việt (tránh literal combining chars trong source).

export function normProvinceKey(s: string | null | undefined): string {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .trim()
}
