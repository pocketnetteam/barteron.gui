import { describe, expect, it } from 'vitest'
import { isJsonObject, isTxid, objectOr, parseJson, parseJsonObject, str, txTimeMs } from './tx'

describe('txTimeMs', () => {
  const now = 1_763_000_000_000

  it('the node sends seconds; milliseconds and numeric strings are read too', () => {
    expect(txTimeMs(1_770_000_000, now)).toBe(1_770_000_000_000)
    expect(txTimeMs(1_770_000_000_000, now)).toBe(1_770_000_000_000)
    expect(txTimeMs('1770000000', now)).toBe(1_770_000_000_000)
  })

  it('no usable time is «now», like the old models', () => {
    for (const time of [undefined, null, 0, -5, Number.NaN, Infinity, '', 'soon', {}]) {
      expect(txTimeMs(time, now)).toBe(now)
    }
  })
})

describe('isTxid', () => {
  it('64 hex characters, any case; nothing else', () => {
    expect(isTxid('a'.repeat(64))).toBe(true)
    expect(isTxid('AbC0'.repeat(16))).toBe(true)
    expect(isTxid('a'.repeat(63))).toBe(false)
    expect(isTxid('a'.repeat(65))).toBe(false)
    expect(isTxid('g'.repeat(64))).toBe(false)
    expect(isTxid('draft')).toBe(false)
    expect(isTxid(` ${'a'.repeat(64)}`)).toBe(false)
    expect(isTxid(null)).toBe(false)
  })
})

describe('JSON from the chain', () => {
  it('broken or empty JSON is undefined instead of an exception', () => {
    expect(parseJson('{"t":1')).toBeUndefined()
    expect(parseJson('')).toBeUndefined()
    expect(parseJson(null)).toBeUndefined()
    expect(parseJson('[1]')).toEqual([1])
  })

  it('an object is only a plain object: not an array, not null', () => {
    expect(isJsonObject({})).toBe(true)
    expect(isJsonObject([])).toBe(false)
    expect(isJsonObject(null)).toBe(false)
    expect(isJsonObject('{}')).toBe(false)
    expect(parseJsonObject('[{"t":1}]')).toEqual({})
    expect(parseJsonObject('null')).toEqual({})
    expect(parseJsonObject('{"t":1}')).toEqual({ t: 1 })
  })

  it('wrong types fall back', () => {
    expect(str(5)).toBe('')
    expect(str(undefined, 'new')).toBe('new')
    expect(str('used', 'new')).toBe('used')
    expect(objectOr([1], { a: 1 })).toEqual({ a: 1 })
    expect(objectOr({ b: 2 }, {})).toEqual({ b: 2 })
  })
})
