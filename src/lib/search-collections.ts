import { removeVietnameseDiacritics } from './vietnamese-slugify'
import { examToResult, eventToResult, postToResult, type CatId, type SearchResult } from './search-index'

export type CollectionSlug = 'exams' | 'events' | 'posts'

export interface CatSource {
  collection: CollectionSlug
  baseWhere: Record<string, unknown>
  searchKeyField: string
  toResult: (doc: any) => SearchResult
  supportsYear: boolean
  supportsAnswer: boolean
  sortField: string
}

export const CAT_SOURCES: Record<CatId, CatSource> = {
  thpt: { collection: 'exams',  baseWhere: { category: { equals: 'vao-dai-hoc' } },      searchKeyField: 'searchKey',      toResult: examToResult,  supportsYear: true,  supportsAnswer: true,  sortField: 'year' },
  l10:  { collection: 'exams',  baseWhere: { category: { equals: 'vao-10' } },            searchKeyField: 'searchKey',      toResult: examToResult,  supportsYear: true,  supportsAnswer: true,  sortField: 'year' },
  hsa:  { collection: 'events', baseWhere: { submenu: { in: ['dgnl', 'dgnl-thu'] } },     searchKeyField: 'searchKeyEvent', toResult: eventToResult, supportsYear: false, supportsAnswer: false, sortField: 'startAt' },
  blog: { collection: 'posts',  baseWhere: {},                                             searchKeyField: 'searchKeyPost',  toResult: postToResult,  supportsYear: false, supportsAnswer: false, sortField: 'publishedAt' },
}

export interface CatFilters { q?: string; year?: string; hasAnswer?: boolean }

export function buildCatWhere(cat: CatId, f: CatFilters = {}): Record<string, any> {
  const src = CAT_SOURCES[cat]
  const where: Record<string, any> = { _status: { equals: 'published' }, ...src.baseWhere }
  if (f.q) where[src.searchKeyField] = { contains: removeVietnameseDiacritics(f.q).toLowerCase() }
  if (f.year && src.supportsYear) where.year = { equals: f.year }
  if (f.hasAnswer && src.supportsAnswer) where.dapAnReady = { equals: true }
  return where
}
