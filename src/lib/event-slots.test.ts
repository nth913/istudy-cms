import { describe, it, expect } from 'vitest'
import type { Event } from '../payload-types'
import {
  isActive,
  pickHero,
  pickPopup,
  pickMegamenuPromos,
  pickSlots,
  detectPinConflicts,
} from './event-slots'

const makeEvent = (overrides: Partial<Event>): Event =>
  ({
    id: 'e1',
    title: 'Test',
    submenu: 'thpt-qg',
    startAt: '2026-06-27T07:30:00+07:00',
    endAt: '2026-06-27T23:59:00+07:00',
    examEndTime: '2026-06-27T09:30:00+07:00',
    _status: 'published',
    deReady: false,
    dapAnReady: false,
    priority: 50,
    leadDays: 14,
    kind: 'live-exam',
    surfaces: ['header-mega'],
    registeredCount: 0,
    subject: 'Tiếng Anh',
    heroEyebrow: 'Test',
    short: 'Test',
    manualPin: { hero: false, popup: false },
    updatedAt: '2026-05-01T00:00:00+07:00',
    createdAt: '2026-05-01T00:00:00+07:00',
    ...overrides,
  }) as Event

describe('isActive', () => {
  it('returns false when _status=draft', () => {
    const e = makeEvent({ _status: 'draft' })
    expect(isActive(e, new Date('2026-06-27T08:00:00+07:00'))).toBe(false)
  })
  it('returns false when startAt missing', () => {
    const e = makeEvent({ startAt: null as unknown as string })
    expect(isActive(e, new Date('2026-06-27T08:00:00+07:00'))).toBe(false)
  })
  it('returns true when now in [startAt - leadDays, endAt + 14d]', () => {
    const e = makeEvent({ leadDays: 14 })
    expect(isActive(e, new Date('2026-06-20T00:00:00+07:00'))).toBe(true)
  })
  it('returns false when now > endAt + 14d', () => {
    const e = makeEvent({})
    expect(isActive(e, new Date('2026-07-20T00:00:00+07:00'))).toBe(false)
  })
  it('returns false when now < startAt - leadDays', () => {
    const e = makeEvent({ leadDays: 14 })
    expect(isActive(e, new Date('2026-05-01T00:00:00+07:00'))).toBe(false)
  })
})

describe('pickHero', () => {
  it('returns null when no active event', () => {
    expect(pickHero([], new Date('2026-06-27T08:00:00+07:00'))).toBeNull()
  })
  it('returns the only active event', () => {
    const e = makeEvent({ id: 'a' })
    expect(pickHero([e], new Date('2026-06-27T08:00:00+07:00'))).toBe('a')
  })
  it('picks lowest priority when 2 active events', () => {
    const a = makeEvent({ id: 'a', priority: 20 })
    const b = makeEvent({ id: 'b', priority: 10 })
    expect(pickHero([a, b], new Date('2026-06-27T08:00:00+07:00'))).toBe('b')
  })
  it('Q2 decision: 2 pinned, picks lower priority (winner)', () => {
    const a = makeEvent({ id: 'a', priority: 20, manualPin: { hero: true, popup: false } })
    const b = makeEvent({ id: 'b', priority: 10, manualPin: { hero: true, popup: false } })
    expect(pickHero([a, b], new Date('2026-06-27T08:00:00+07:00'))).toBe('b')
  })
  it('Q2 decision: 1 pinned + 1 unpinned with lower priority — pinned still wins', () => {
    const pinned = makeEvent({ id: 'p', priority: 99, manualPin: { hero: true, popup: false } })
    const unpinned = makeEvent({ id: 'u', priority: 1, manualPin: { hero: false, popup: false } })
    expect(pickHero([pinned, unpinned], new Date('2026-06-27T08:00:00+07:00'))).toBe('p')
  })
})

describe('pickPopup', () => {
  it('returns fresh dap-an event over fresh de event', () => {
    const now = new Date('2026-06-28T10:00:00+07:00') // 1 day after exam
    const de = makeEvent({ id: 'de1', deReady: true, dapAnReady: false })
    const dapAn = makeEvent({ id: 'da1', deReady: true, dapAnReady: true })
    expect(pickPopup([de, dapAn], now)).toBe('da1')
  })
  it('falls back to hero when no fresh content', () => {
    const now = new Date('2026-06-20T00:00:00+07:00') // before exam
    const e = makeEvent({ id: 'x', priority: 5 })
    expect(pickPopup([e], now)).toBe('x')
  })
  it('respects FRESH_DAYS=7 window', () => {
    const now = new Date('2026-07-10T00:00:00+07:00') // 13 days after exam — outside fresh window
    const dapAn = makeEvent({ id: 'da1', deReady: true, dapAnReady: true })
    // Falls back to hero (the only event, still in endAt+14d window)
    expect(pickPopup([dapAn], now)).toBe('da1')
  })
})

describe('pickMegamenuPromos', () => {
  it('returns 1 winner per submenu', () => {
    const a = makeEvent({ id: 'a', submenu: 'thpt-qg', priority: 10 })
    const b = makeEvent({ id: 'b', submenu: 'thpt-qg', priority: 20 })
    const c = makeEvent({ id: 'c', submenu: 'vao-10', priority: 30 })
    const result = pickMegamenuPromos([a, b, c], new Date('2026-06-27T08:00:00+07:00'))
    expect(result).toEqual({ 'thpt-qg': 'a', 'vao-10': 'c' })
  })
  it('skips events without submenu', () => {
    const a = makeEvent({ id: 'a', submenu: null as unknown as Event['submenu'] })
    expect(pickMegamenuPromos([a], new Date('2026-06-27T08:00:00+07:00'))).toEqual({})
  })
})

describe('pickSlots', () => {
  it('combines all 3 picks into one result', () => {
    const e = makeEvent({ id: 'one', submenu: 'thpt-qg' })
    const result = pickSlots([e], new Date('2026-06-27T08:00:00+07:00'))
    expect(result.hero).toBe('one')
    expect(result.popup).toBe('one') // fallback to hero
    expect(result.megamenuPromos).toEqual({ 'thpt-qg': 'one' })
  })
})

describe('detectPinConflicts', () => {
  it('returns empty when no conflict', () => {
    const e = makeEvent({ id: 'a', manualPin: { hero: true, popup: false } })
    expect(detectPinConflicts([e])).toEqual([])
  })
  it('detects 2-event hero conflict', () => {
    const a = makeEvent({ id: 'a', priority: 10, manualPin: { hero: true, popup: false } })
    const b = makeEvent({ id: 'b', priority: 20, manualPin: { hero: true, popup: false } })
    const result = detectPinConflicts([a, b])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ slot: 'hero', winner: 'a', losers: ['b'] })
  })
  it('ignores draft events in conflict detection', () => {
    const a = makeEvent({ id: 'a', manualPin: { hero: true, popup: false } })
    const b = makeEvent({
      id: 'b',
      _status: 'draft',
      manualPin: { hero: true, popup: false },
    })
    expect(detectPinConflicts([a, b])).toEqual([])
  })
})
