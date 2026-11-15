import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { slavicPlural } from '@/i18n'
import { avatarColor, AVATAR_COLORS, initials } from './avatar'
import { ICONS } from './icons'
import { nextIndex } from './roving'
import { dismissAll, showToast, toasts, updateToast } from './toast'

describe('initials', () => {
  it.each([
    ['Илья Петров', 'ИП'],
    ['мария', 'М'],
    ['  Анна   Ковалёва  Сергеевна ', 'АК'],
    ['Вы (заглушка)', 'ВЗ'],
    ['— Дмитрий', 'Д'],
    ['', ''],
    [null, ''],
  ])('%j → %j', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})

describe('avatarColor', () => {
  it('is stable for the same seed and picks from the palette', () => {
    const seed = 'PMockUser1111111111111111111111111'
    expect(avatarColor(seed)).toBe(avatarColor(seed))
    expect(AVATAR_COLORS).toContain(avatarColor(seed))
    expect(AVATAR_COLORS).toContain(avatarColor(undefined))
  })
})

describe('slavicPlural', () => {
  it.each([
    [1, 0],
    [21, 0],
    [2, 1],
    [4, 1],
    [22, 1],
    [5, 2],
    [11, 2],
    [12, 2],
    [14, 2],
    [41, 0],
    [0, 2],
    [1.5, 1],
  ])('%d → form %d', (n, form) => {
    expect(slavicPlural(n, 3)).toBe(form)
  })
})

describe('nextIndex', () => {
  it('wraps around and handles Home / End', () => {
    expect(nextIndex('ArrowRight', 2, 3)).toBe(0)
    expect(nextIndex('ArrowLeft', 0, 3)).toBe(2)
    expect(nextIndex('ArrowDown', 0, 3)).toBe(1)
    expect(nextIndex('Home', 2, 3)).toBe(0)
    expect(nextIndex('End', 0, 3)).toBe(2)
    expect(nextIndex('Enter', 0, 3)).toBeNull()
    expect(nextIndex('ArrowRight', 0, 0)).toBeNull()
  })
})

describe('icons', () => {
  it('has the 36 icons of the foundations sheet', () => {
    const base = ['search', 'heart', 'exchange', 'pkoin', 'safe-deal', 'node', 'wallet', 'chat']
    for (const name of base) expect(ICONS).toHaveProperty(name)
    expect(Object.keys(ICONS).length).toBeGreaterThanOrEqual(36)
  })
})

describe('toasts', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    dismissAll()
    vi.useRealTimers()
  })

  it('hides a success toast after 4 s', () => {
    showToast('Ссылка скопирована')
    expect(toasts.items).toHaveLength(1)
    vi.advanceTimersByTime(4000)
    expect(toasts.items).toHaveLength(0)
  })

  it('keeps a progress toast until it is updated', () => {
    const id = showToast('Публикуем…', { kind: 'progress' })
    vi.advanceTimersByTime(60_000)
    expect(toasts.items[0]?.text).toBe('Публикуем…')

    updateToast(id, 'Опубликовано', { kind: 'success' })
    expect(toasts.items[0]).toMatchObject({ kind: 'success', text: 'Опубликовано' })
    vi.advanceTimersByTime(4000)
    expect(toasts.items).toHaveLength(0)
  })

  it('shows at most three', () => {
    for (const text of ['1', '2', '3', '4']) showToast(text)
    expect(toasts.items.map((t) => t.text)).toEqual(['2', '3', '4'])
  })

  it('more than three: a progress toast stays, its result is still to come', () => {
    const id = showToast('Публикуем…', { kind: 'progress' })
    for (const text of ['1', '2', '3']) showToast(text)
    expect(toasts.items.map((t) => t.text)).toEqual(['Публикуем…', '2', '3'])
    updateToast(id, 'Опубликовано', { kind: 'success' })
    expect(toasts.items[0]?.text).toBe('Опубликовано')
  })

  it('keeps errors and toasts with an action until they are closed (s8-confirm)', () => {
    showToast('Ошибка на ноде', { kind: 'error' })
    showToast('Объявление снято', { action: { label: 'Вернуть', run: () => undefined } })
    vi.advanceTimersByTime(60_000)
    expect(toasts.items.map((t) => t.text)).toEqual(['Ошибка на ноде', 'Объявление снято'])
  })
})
