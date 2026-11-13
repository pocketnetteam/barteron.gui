import { describe, expect, it, vi } from 'vitest'
import { createMockSdk } from './mock'
import { syncTunnel } from './tunnel'

function registration(script: string | null) {
  const worker = script ? ({ scriptURL: script } as ServiceWorker) : null
  return {
    active: worker,
    waiting: null,
    installing: null,
    unregister: vi.fn(async () => true),
  } as unknown as ServiceWorkerRegistration & { unregister: ReturnType<typeof vi.fn> }
}

describe('the Tor fetch tunnel at start', () => {
  it('Tor on: sdk.js registers the worker, nothing is removed', async () => {
    const sdk = createMockSdk()
    const register = vi.fn(async () => null)
    sdk.serviceWorker = { register }
    const getRegistrations = vi.fn(async () => [])
    await syncTunnel(sdk, true, { getRegistrations })
    expect(register).toHaveBeenCalledOnce()
    expect(getRegistrations).not.toHaveBeenCalled()
  })

  it('Tor off: the worker left from an earlier visit is removed, other workers stay', async () => {
    const sdk = createMockSdk()
    const register = vi.fn(async () => null)
    sdk.serviceWorker = { register }
    const tunnel = registration('https://barteron.club/miniapp-service-worker.js')
    const other = registration('https://barteron.club/other-worker.js')
    const empty = registration(null)
    await syncTunnel(sdk, false, { getRegistrations: async () => [tunnel, other, empty] })
    expect(register).not.toHaveBeenCalled()
    expect(tunnel.unregister).toHaveBeenCalledOnce()
    expect(other.unregister).not.toHaveBeenCalled()
    expect(empty.unregister).not.toHaveBeenCalled()
  })

  it('no service workers here, or the browser refuses: start goes on', async () => {
    const sdk = createMockSdk()
    await expect(syncTunnel(sdk, false, undefined)).resolves.toBeUndefined()
    await expect(
      syncTunnel(sdk, false, { getRegistrations: () => Promise.reject(new Error('SecurityError')) })
    ).resolves.toBeUndefined()
    sdk.serviceWorker = { register: () => Promise.reject(new Error('no')) }
    await expect(syncTunnel(sdk, true)).resolves.toBeUndefined()
  })
})
