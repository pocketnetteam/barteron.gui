import { describe, expect, it } from 'vitest'
import {
  deliveryOptions,
  formatHours,
  hasDeliveryChoice,
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
