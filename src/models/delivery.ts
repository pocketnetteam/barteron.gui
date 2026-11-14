/**
 * How the buyer gets the item, as the old app writes it in the offer (`d`):
 *
 * - `deliveryOptions` = {selfPickup: {isEnabled, additionalInfo},
 *   directDelivery: {isEnabled, additionalInfo}, pickupPoints: {isEnabled, ids}}
 *   — on an ordinary offer (old Create/content/index.js:735-748);
 * - `pickupPoint` = {financialTerms, workSchedule, address, route} — on a
 *   pickup point, an offer of category 97 (index.js:724-729).
 */

import { isPickupPointOwner } from '@/config/delivery'
import type { LatLng } from '@/lib/geohash'
import { isOfferActive, isPickupPoint, type Offer } from './offer'
import { isJsonObject, type JsonObject } from './tx'

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')
const obj = (value: unknown): JsonObject => (isJsonObject(value) ? value : {})

export interface DeliveryOptions {
  selfPickup: { enabled: boolean; info: string }
  directDelivery: { enabled: boolean; info: string }
  pickupPoints: { enabled: boolean; ids: string[] }
}

export function deliveryOptions(offer: Pick<Offer, 'delivery'>): DeliveryOptions {
  const options = obj(offer.delivery.deliveryOptions)
  const self = obj(options.selfPickup)
  const direct = obj(options.directDelivery)
  const points = obj(options.pickupPoints)
  const ids = Array.isArray(points.ids)
    ? [...new Set(points.ids.filter((id): id is string => typeof id === 'string' && !!id))]
    : []
  return {
    selfPickup: { enabled: self.isEnabled === true, info: text(self.additionalInfo) },
    directDelivery: { enabled: direct.isEnabled === true, info: text(direct.additionalInfo) },
    pickupPoints: { enabled: points.isEnabled === true && ids.length > 0, ids },
  }
}

/** The seller listed at least one way: the buyer must pick one before buying. */
export const hasDeliveryChoice = (options: DeliveryOptions): boolean =>
  options.selfPickup.enabled || options.directDelivery.enabled || options.pickupPoints.enabled

/** What the buyer chose on the offer page: a way, or a pickup point by its id. */
export type DeliveryPick =
  { way: 'selfPickup' } | { way: 'directDelivery' } | { way: 'pickupPoint'; id: string }

// ─── Pickup points ───────────────────────────────────────────────────────────

/** One day of the week: round the clock, or from–to (`HH:MM`). `null` — closed. */
export type WorkDay = { allDay: true } | { start: string; finish: string } | null

export interface WorkSchedule {
  /** Monday first, as the old `day1`…`day7`. */
  days: WorkDay[]
  info: string
}

export interface PickupPointInfo {
  financialTerms: string
  schedule: WorkSchedule
  address: string
  route: string
}

/** The old app showed a fixed storage period; the offer has no field for it. */
export const PICKUP_STORAGE_DAYS = 14

const TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/

/** `HH:MM`, as the old form's time input writes it; «9:00» gets its zero. */
const time = (value: unknown): string | null => {
  const t = text(value)
  return TIME.test(t) ? t.padStart(5, '0') : null
}

function workDay(value: unknown): WorkDay {
  if (!isJsonObject(value)) return null
  if (value.allDay === true) return { allDay: true }
  const start = time(value.startTime)
  const finish = time(value.finishTime)
  return start && finish ? { start, finish } : null
}

export function workSchedule(value: unknown): WorkSchedule {
  const schedule = obj(value)
  const week = obj(schedule.weekDays)
  return {
    days: Array.from({ length: 7 }, (_, i) => workDay(week[`day${i + 1}`])),
    info: text(schedule.additionalInfo),
  }
}

export function pickupPointInfo(offer: Pick<Offer, 'delivery'>): PickupPointInfo {
  const point = obj(offer.delivery.pickupPoint)
  return {
    financialTerms: text(point.financialTerms),
    schedule: workSchedule(point.workSchedule),
    address: text(point.address),
    route: text(point.route),
  }
}

const minutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h! * 60 + m!
}

/** Monday = 0, as in the schedule. */
const weekday = (date: Date): number => (date.getDay() + 6) % 7

export type OpenState =
  | { kind: 'always' }
  | { kind: 'open'; until: string }
  | { kind: 'closed'; opens?: { day: number; time: string; today: boolean } }
  | { kind: 'unknown' }

/**
 * The point's clock is likely the viewer's: the sun at its longitude keeps
 * the viewer's time give or take two hours (zones are wider than 15°, and
 * summer time adds one). No place — nothing to compare, as before.
 */
function sameClock(at: LatLng | null | undefined, now: Date): boolean {
  if (!at || !Number.isFinite(at[1])) return true
  const sun = Math.round(at[1] / 15)
  const viewer = -now.getTimezoneOffset() / 60
  const gap = Math.abs(((((sun - viewer) % 24) + 36) % 24) - 12)
  return gap <= 2
}

/**
 * Open now or not, by the viewer's clock: the offer does not say which time
 * zone the point is in, and the buyer is usually nearby. A point far east or
 * west of the viewer (`at`, its place) is `unknown`: its hours stand, «open
 * now» is not guessed. A day may run past midnight (22:00–02:00): the old
 * form refuses it, other clients might not.
 */
export function openState(schedule: WorkSchedule, now = new Date(), at?: LatLng | null): OpenState {
  if (!schedule.days.some(Boolean)) return { kind: 'unknown' }
  if (schedule.days.every((d) => d && 'allDay' in d)) return { kind: 'always' }
  if (!sameClock(at, now)) return { kind: 'unknown' }
  const today = weekday(now)
  const clock = now.getHours() * 60 + now.getMinutes()
  const day = schedule.days[today]
  const yesterday = schedule.days[(today + 6) % 7]
  if (day && 'allDay' in day) return { kind: 'open', until: '24:00' }
  if (yesterday && !('allDay' in yesterday)) {
    const night = minutes(yesterday.finish) < minutes(yesterday.start)
    if (night && clock < minutes(yesterday.finish)) {
      return { kind: 'open', until: yesterday.finish }
    }
  }
  if (day) {
    const start = minutes(day.start)
    const finish = minutes(day.finish)
    if (clock >= start && (clock < finish || finish < start)) {
      return { kind: 'open', until: day.finish }
    }
  }
  if (day && clock < minutes(day.start)) {
    return { kind: 'closed', opens: { day: today, time: day.start, today: true } }
  }
  for (let step = 1; step <= 7; step++) {
    const index = (today + step) % 7
    const next = schedule.days[index]
    if (next) {
      return {
        kind: 'closed',
        opens: { day: index, time: 'allDay' in next ? '00:00' : next.start, today: false },
      }
    }
  }
  return { kind: 'closed' }
}

/**
 * May be offered as a pickup point: a live offer of category 97 from an
 * address allowed to run them. The old form offered sellers only such points;
 * an offer's ids are checked again, so a stranger's point put in by hand is
 * not shown to the buyer as a real one.
 */
export const isUsablePickupPoint = (offer: Offer, now = Date.now()): boolean =>
  isPickupPoint(offer) && isOfferActive(offer, now) && isPickupPointOwner(offer.address)

/** «10–21», «9:30–18» — hours without «:00», as in the mockup. */
export function formatHours(day: Exclude<WorkDay, null | { allDay: true }>): string {
  const short = (time: string) => {
    const [h, m] = time.split(':')
    return m === '00' ? String(Number(h)) : `${Number(h)}:${m}`
  }
  return `${short(day.start)}–${short(day.finish)}`
}
