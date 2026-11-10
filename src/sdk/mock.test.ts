import { describe, expect, it, vi } from 'vitest'
import { createMockSdk, MOCK_ADDRESS } from './mock'

describe('mock SDK', () => {
  it('returns the mock address when signed in and permitted', async () => {
    await expect(createMockSdk().get.account()).resolves.toEqual({ address: MOCK_ADDRESS })
  })

  it('rejects account() without the permission, like the host', async () => {
    const sdk = createMockSdk({ granted: [] })
    await expect(sdk.get.account()).rejects.toThrow('permission:account')
    await sdk.permissions.request(['account'])
    await expect(sdk.get.account()).resolves.toEqual({ address: MOCK_ADDRESS })
  })

  it('rejects account() when nobody is signed in', async () => {
    await expect(createMockSdk({ address: null }).get.account()).rejects.toThrow(
      'not_authenticated'
    )
  })

  it('answers RPC from fixtures and rejects methods without one', async () => {
    const sdk = createMockSdk({ rpc: { getnodeinfo: () => ({ version: 'mock' }) } })
    await expect(sdk.rpc('getnodeinfo')).resolves.toEqual({ version: 'mock' })
    await expect(sdk.rpc('getbarteronfeed', [{}])).rejects.toThrow(
      'mock_rpc_missing:getbarteronfeed'
    )
  })

  it('gives each write its own transaction id and records the call', async () => {
    const sdk = createMockSdk()
    const first = await sdk.barteron.offer({ hash: 'a' })
    const second = await sdk.barteron.offer({ hash: 'b' })
    expect(first.transaction).toHaveLength(64)
    expect(first.transaction).not.toBe(second.transaction)
    expect(sdk.mock.calls.filter((c) => c.method === 'barteron.offer')).toHaveLength(2)
  })

  it('delivers pushed host events to listeners until they unsubscribe', () => {
    const sdk = createMockSdk()
    const listener = vi.fn()
    sdk.on('theme', listener)
    sdk.mock.push('theme', { rootid: 'dark' })
    sdk.off('theme', listener)
    sdk.mock.push('theme', { rootid: 'light' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ rootid: 'dark' })
  })
})

describe('mock SDK theme', () => {
  function fakeMedia(matches: boolean) {
    const listeners: ((e: { matches: boolean }) => void)[] = []
    const media = {
      matches,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.push(fn),
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(media as unknown as MediaQueryList)
    return {
      set(value: boolean) {
        media.matches = value
        listeners.forEach((fn) => fn({ matches: value }))
      },
    }
  }

  it('follows the OS scheme when no theme is given', async () => {
    const os = fakeMedia(true)
    const sdk = createMockSdk()
    expect((await sdk.get.appinfo()).theme).toEqual({ rootid: 'dark' })

    const onTheme = vi.fn()
    sdk.on('theme', onTheme)
    os.set(false)
    expect(onTheme).toHaveBeenCalledWith({ rootid: 'light' })
  })

  it('keeps an explicit theme', async () => {
    fakeMedia(true)
    const sdk = createMockSdk({ theme: 'light' })
    expect((await sdk.get.appinfo()).theme).toEqual({ rootid: 'light' })
  })
})
