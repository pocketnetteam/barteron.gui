import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { blockStorage, fillStorage } from '@/test/storage'
import {
  onStorageChange,
  readStored,
  removeStored,
  storageKeepsAll,
  storedKeys,
  writeStored,
} from './storage'

const KEYS = ['P1_like', 'P1_offer_draft', 'P1_offer_draft_x', 'P2_offer_draft']

beforeEach(() => localStorage.clear())
afterEach(() => KEYS.forEach(removeStored))

describe('storage the browser refuses', () => {
  it('reads give the default, writes say they failed, the app goes on', () => {
    const restore = blockStorage()
    try {
      expect(readStored('P1_like', ['none'])).toEqual(['none'])
      expect(storedKeys('P1_')).toEqual([])
      expect(storageKeepsAll()).toBe(false)
      expect(writeStored('P1_like', ['a'])).toBe(false)
    } finally {
      restore()
    }
  })

  it('what could not be written lives until reload: the next page of this visit reads it', () => {
    const restore = blockStorage()
    try {
      writeStored('P1_offer_draft', { caption: 'Велосипед' })
      writeStored('P1_offer_draft_x', { caption: 'Самокат' })
      writeStored('P2_offer_draft', { caption: 'чужой' })
      expect(readStored('P1_offer_draft', null)).toEqual({ caption: 'Велосипед' })
      expect(storedKeys('P1_offer_draft').sort()).toEqual(['P1_offer_draft', 'P1_offer_draft_x'])
      removeStored('P1_offer_draft_x')
      expect(readStored('P1_offer_draft_x', null)).toBeNull()
      expect(storedKeys('P1_offer_draft')).toEqual(['P1_offer_draft'])
    } finally {
      restore()
    }
  })
})

describe('storage that is full', () => {
  it('the newer value is read back, not the older one still on the device', () => {
    writeStored('P1_like', ['old'])
    const restore = fillStorage()
    try {
      expect(writeStored('P1_like', ['old', 'new'])).toBe(false)
      expect(readStored('P1_like', [])).toEqual(['old', 'new'])
      expect(storedKeys('P1_like')).toEqual(['P1_like'])
      expect(storageKeepsAll()).toBe(false)
    } finally {
      restore()
    }
    // Room again, but the newer value is still only in memory.
    expect(storageKeepsAll()).toBe(false)
    // Written again: the value goes to the device and memory lets it go.
    expect(writeStored('P1_like', ['old', 'new', 'more'])).toBe(true)
    expect(JSON.parse(localStorage.getItem('P1_like')!)).toEqual(['old', 'new', 'more'])
    expect(storageKeepsAll()).toBe(true)
  })
})

describe('storage that works', () => {
  it('values go to the device as JSON; broken JSON gives the default', () => {
    expect(writeStored('P1_like', ['a'])).toBe(true)
    expect(localStorage.getItem('P1_like')).toBe('["a"]')
    localStorage.setItem('P1_offer_draft', '{oops')
    expect(readStored('P1_offer_draft', 'default')).toBe('default')
    expect(storageKeepsAll()).toBe(true)
  })
})

describe('another tab', () => {
  it('a change to the key, or storage cleared, calls back; other keys do not', () => {
    const changed = vi.fn()
    let key = 'P1_like'
    const stop = onStorageChange(() => key, changed)
    window.dispatchEvent(new StorageEvent('storage', { key: 'P1_like' }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'P1_viewed' }))
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
    expect(changed).toHaveBeenCalledTimes(2)
    // The key follows the account.
    key = 'P2_like'
    window.dispatchEvent(new StorageEvent('storage', { key: 'P2_like' }))
    expect(changed).toHaveBeenCalledTimes(3)
    stop()
    window.dispatchEvent(new StorageEvent('storage', { key: 'P2_like' }))
    expect(changed).toHaveBeenCalledTimes(3)
  })

  it('a value another tab wrote replaces the one this tab could not write', () => {
    const restore = fillStorage()
    writeStored('P1_like', ['mine'])
    restore()
    const stop = onStorageChange(
      () => 'P1_like',
      () => undefined
    )
    localStorage.setItem('P1_like', '["theirs"]')
    window.dispatchEvent(new StorageEvent('storage', { key: 'P1_like' }))
    expect(readStored('P1_like', [])).toEqual(['theirs'])
    stop()
  })
})
