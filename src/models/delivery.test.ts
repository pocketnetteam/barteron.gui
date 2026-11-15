import { describe, expect, it, vi } from 'vitest'
import { emptyOffer, PICKUP_POINT_CATEGORY } from './offer'
import {
  deliveryOptions,
  formatHours,
  hasDeliveryChoice,
  isUsablePickupPoint,
  openState,
  pickupPointInfo,
  workSchedule,
} from './delivery'

const offer = (d: unknown) => ({ delivery: d as Record<string, unknown> })

describe('deliveryOptions', () => {
  it('reads the old `deliveryOptions` block', () => {
    const options = deliveryOptions(
      offer({
        deliveryOptions: {
          selfPickup: { isEnabled: true, additionalInfo: ' м. Таганская ' },
          directDelivery: { isEnabled: false, additionalInfo: 'СДЭК' },
          pickupPoints: { isEnabled: true, ids: ['a', 'b', 'a', 7, ''] },
        },
      })
    )
    expect(options.selfPickup).toEqual({ enabled: true, info: 'м. Таганская' })
    expect(options.directDelivery.enabled).toBe(false)
    expect(options.pickupPoints).toEqual({ enabled: true, ids: ['a', 'b'] })
    expect(hasDeliveryChoice(options)).toBe(true)
  })

  it('pickup points without ids are no choice; an empty block means none', () => {
    expect(
      deliveryOptions(offer({ deliveryOptions: { pickupPoints: { isEnabled: true, ids: [] } } }))
        .pickupPoints.enabled
    ).toBe(false)
    expect(hasDeliveryChoice(deliveryOptions(offer({})))).toBe(false)
  })
})

describe('pickup point', () => {
  const schedule = {
    weekDays: {
      day1: { startTime: '10:00', finishTime: '21:00' },
      day2: { startTime: '10:00', finishTime: '21:00' },
      day6: { allDay: true },
      day7: { startTime: '25:00', finishTime: '10:00' },
    },
    additionalInfo: '31 декабря — до 16:00',
  }

  it('reads terms, schedule (Monday first), address and route', () => {
    const info = pickupPointInfo(
      offer({
        pickupPoint: {
          financialTerms: '60 PKOIN',
          workSchedule: schedule,
          address: 'ул. 1',
          route: 'метро',
        },
      })
    )
    expect(info.financialTerms).toBe('60 PKOIN')
    expect(info.address).toBe('ул. 1')
    expect(info.route).toBe('метро')
    expect(info.schedule.days).toEqual([
      { start: '10:00', finish: '21:00' },
      { start: '10:00', finish: '21:00' },
      null,
      null,
      null,
      { allDay: true },
      null, // a broken time is a day off, not a crash
    ])
    expect(info.schedule.info).toBe('31 декабря — до 16:00')
  })

  // 10.11.2026 is a Tuesday.
  const at = (h: number, m = 0, day = 10) => new Date(2026, 10, day, h, m)

  it('open now, until the closing time', () => {
    expect(openState(workSchedule(schedule), at(12))).toEqual({ kind: 'open', until: '21:00' })
  })

  it('closed before opening today, and after closing — opens on the next working day', () => {
    expect(openState(workSchedule(schedule), at(9))).toEqual({
      kind: 'closed',
      opens: { day: 1, time: '10:00', today: true },
    })
    // Tuesday 22:00 → Wednesday to Friday are off → Saturday, round the clock.
    expect(openState(workSchedule(schedule), at(22))).toEqual({
      kind: 'closed',
      opens: { day: 5, time: '00:00', today: false },
    })
  })

  it('round the clock every day; no schedule at all is unknown', () => {
    const always = workSchedule({
      weekDays: Object.fromEntries(
        Array.from({ length: 7 }, (_, i) => [`day${i + 1}`, { allDay: true }])
      ),
    })
    expect(openState(always, at(3))).toEqual({ kind: 'always' })
    expect(openState(workSchedule(undefined), at(3))).toEqual({ kind: 'unknown' })
  })

  it('hours as in the mockup: «10–21», «9:30–18»', () => {
    expect(formatHours({ start: '10:00', finish: '21:00' })).toBe('10–21')
    expect(formatHours({ start: '09:30', finish: '18:00' })).toBe('9:30–18')
  })
})

describe('pickup point: the edges of the schedule', () => {
  // 10.11.2026 is a Tuesday.
  const at = (h: number, m = 0, day = 10) => new Date(2026, 10, day, h, m)
  /** Tuesday open through midnight; Thursday the usual hours. */
  const night = workSchedule({
    weekDays: {
      day2: { startTime: '22:00', finishTime: '02:00' },
      day4: { startTime: '10:00', finishTime: '18:00' },
    },
  })

  it('open through midnight: from the evening and after midnight, until the closing time', () => {
    expect(openState(night, at(21))).toEqual({
      kind: 'closed',
      opens: { day: 1, time: '22:00', today: true },
    })
    expect(openState(night, at(23, 30))).toEqual({ kind: 'open', until: '02:00' })
    // Wednesday 01:00 — still Tuesday's night.
    expect(openState(night, at(1, 0, 11))).toEqual({ kind: 'open', until: '02:00' })
    expect(openState(night, at(2, 0, 11))).toEqual({
      kind: 'closed',
      opens: { day: 3, time: '10:00', today: false },
    })
  })

  it('Sunday night runs into Monday', () => {
    const sunday = workSchedule({ weekDays: { day7: { startTime: '20:00', finishTime: '03:00' } } })
    // 16.11.2026 is a Monday.
    expect(openState(sunday, at(2, 59, 16))).toEqual({ kind: 'open', until: '03:00' })
    expect(openState(sunday, at(3, 0, 16)).kind).toBe('closed')
  })

  it('closes at the closing minute; a round-the-clock day among others is open to midnight', () => {
    const week = workSchedule({
      weekDays: {
        day2: { startTime: '10:00', finishTime: '18:00' },
        day6: { allDay: true },
      },
    })
    expect(openState(week, at(17, 59)).kind).toBe('open')
    expect(openState(week, at(18))).toEqual({
      kind: 'closed',
      opens: { day: 5, time: '00:00', today: false },
    })
    // 14.11.2026 is a Saturday.
    expect(openState(week, at(3, 0, 14))).toEqual({ kind: 'open', until: '24:00' })
  })

  it('the only working day is over: it opens again in a week', () => {
    const tuesday = workSchedule({
      weekDays: { day2: { startTime: '10:00', finishTime: '18:00' } },
    })
    expect(openState(tuesday, at(19))).toEqual({
      kind: 'closed',
      opens: { day: 1, time: '10:00', today: false },
    })
  })

  it('round the clock is `allDay: true` only; other values keep the hours', () => {
    const days = workSchedule({
      weekDays: { day1: { allDay: 'false', startTime: '10:00', finishTime: '18:00' } },
    }).days
    expect(days[0]).toEqual({ start: '10:00', finish: '18:00' })
  })

  it('an hour without its zero, «9:00», reads as «09:00»', () => {
    const days = workSchedule({
      weekDays: { day1: { startTime: '9:00', finishTime: '18:00' } },
    }).days
    expect(days[0]).toEqual({ start: '09:00', finish: '18:00' })
  })

  it('a point in another time zone: «open now» is not guessed by the viewer clock', () => {
    // The viewer at UTC+3: off zero, so a sign mixed up shows on a UTC runner too.
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-180)
    const now = at(12)
    const day = workSchedule({
      weekDays: Object.fromEntries(
        Array.from({ length: 7 }, (_, i) => [
          `day${i + 1}`,
          { startTime: '10:00', finishTime: '18:00' },
        ])
      ),
    })
    // Longitude where the sun keeps the viewer's own clock, and six hours east of it.
    const here = (-now.getTimezoneOffset() / 60) * 15
    const wrap = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180
    expect(openState(day, now, [55, wrap(here)])).toEqual({ kind: 'open', until: '18:00' })
    expect(openState(day, now, [55, wrap(here + 30)])).toEqual({ kind: 'open', until: '18:00' })
    expect(openState(day, now, [55, wrap(here + 90)])).toEqual({ kind: 'unknown' })
    expect(openState(day, now, [55, wrap(here - 90)])).toEqual({ kind: 'unknown' })
    // No place: the viewer clock, as before.
    expect(openState(day, now, null)).toEqual({ kind: 'open', until: '18:00' })
    expect(openState(day, now, [55, NaN])).toEqual({ kind: 'open', until: '18:00' })
  })

  it('across the date line: a viewer at +12 and a point at −11 are an hour apart', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-12 * 60)
    const day = workSchedule({
      weekDays: Object.fromEntries(
        Array.from({ length: 7 }, (_, i) => [
          `day${i + 1}`,
          { startTime: '00:00', finishTime: '23:59' },
        ])
      ),
    })
    expect(openState(day, at(12), [-14, -172]).kind).toBe('open')
    expect(openState(day, at(12), [40, -74]).kind).toBe('unknown')
  })
})

describe('isUsablePickupPoint', () => {
  const OWNER = 'PPGNWqWeXMwHon8snDoLNbbT2nkZrN967c'
  const point = (over: Partial<ReturnType<typeof emptyOffer>> = {}) => ({
    ...emptyOffer(OWNER, 'ru-RU'),
    hash: 'a'.repeat(64),
    tag: PICKUP_POINT_CATEGORY,
    published: 'published' as const,
    till: Date.now() + 86_400_000,
    ...over,
  })

  it('a live point of an address allowed to run them', () => {
    expect(isUsablePickupPoint(point())).toBe(true)
  })

  it('another category, a point of a stranger, a withdrawn or expired one are not', () => {
    expect(isUsablePickupPoint(point({ tag: 17 }))).toBe(false)
    expect(isUsablePickupPoint(point({ address: 'P8t2MfpzfoJAhRrzvP3qz9ruTzpKVHUM77' }))).toBe(
      false
    )
    expect(isUsablePickupPoint(point({ published: 'withdrawed' }))).toBe(false)
    expect(isUsablePickupPoint(point({ till: Date.now() - 1 }))).toBe(false)
  })
})
