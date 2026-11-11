import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useNetStore, OFFLINE_AFTER } from '@/stores/net'
import { isChunkLoadError } from './version-conflict'

describe('a chunk that did not load', () => {
  it('is recognised in every browser’s words', () => {
    expect(
      isChunkLoadError(
        new TypeError('Failed to fetch dynamically imported module: https://x/assets/A.js')
      )
    ).toBe(true)
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/B.css'))).toBe(true)
    expect(isChunkLoadError(new Error('mock_rpc_missing:getbarteronfeed'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})

describe('the node not answering', () => {
  it('counts failures in a row; one answer clears them', () => {
    setActivePinia(createPinia())
    const net = useNetStore()
    for (let i = 1; i < OFFLINE_AFTER; i++) net.report(false)
    expect(net.offline).toBe(false)
    net.report(false)
    expect(net.offline).toBe(true)
    net.report(true)
    expect(net.offline).toBe(false)
    expect(net.failures).toBe(0)
  })
})
