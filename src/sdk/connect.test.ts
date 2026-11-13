import { afterEach, describe, expect, it, vi } from 'vitest'
import { connect, isInIframe, loadScript, sdkScriptUrl, withTimeout } from './connect'
import { createMockSdk } from './mock'
import type { BastyonSdkConstructor } from './types'

const base = { sdkHost: 'bastyon.com', allowMock: false }

function installFakeSdk(init: () => Promise<unknown>) {
  class FakeSdk {
    init = init
    get = { appinfo: async () => ({ locale: 'sr', production: true }) }
  }
  window.BastyonSdk = FakeSdk as unknown as BastyonSdkConstructor
}

afterEach(() => {
  delete window.BastyonSdk
})

describe('connect outside Bastyon', () => {
  it('reports "outside" when the build does not allow the mock', async () => {
    expect(await connect({ ...base, inIframe: false })).toEqual({ status: 'outside' })
  })

  it('uses the mock when allowed', async () => {
    const result = await connect({ ...base, allowMock: true, inIframe: false })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.mode).toBe('mock')
    expect(result.appinfo.application?.id).toBe('barteron.pocketnet.app')
  })

  it('never loads the host script for the mock', async () => {
    const load = vi.fn()
    await connect({ ...base, allowMock: true, inIframe: false, loadScript: load })
    expect(load).not.toHaveBeenCalled()
  })
})

describe('connect inside Bastyon', () => {
  it('loads sdk.js from the configured host and returns the full appinfo', async () => {
    installFakeSdk(async () => ({ id: 'barteron.pocketnet.app' }))
    const load = vi.fn(async () => undefined)

    const result = await connect({ ...base, inIframe: true, loadScript: load })

    expect(load).toHaveBeenCalledWith('https://bastyon.com/js/lib/apps/sdk.js', expect.any(Number))
    expect(result).toMatchObject({
      status: 'ready',
      mode: 'bastyon',
      appinfo: { locale: 'sr', production: true },
    })
  })

  it('uses the mock only outside an iframe, even when allowed', async () => {
    installFakeSdk(async () => ({ id: 'barteron.pocketnet.app' }))
    const result = await connect({
      ...base,
      allowMock: true,
      inIframe: true,
      loadScript: async () => undefined,
      createMock: () => createMockSdk(),
    })
    expect(result).toMatchObject({ status: 'ready', mode: 'bastyon' })
  })

  it('fails with "script" when sdk.js does not load', async () => {
    const result = await connect({
      ...base,
      inIframe: true,
      loadScript: async () => {
        throw new Error('sdk_script_error')
      },
    })
    expect(result).toMatchObject({ status: 'failed', reason: 'script' })
  })

  it('fails with "script" when sdk.js loads but defines no BastyonSdk', async () => {
    const result = await connect({ ...base, inIframe: true, loadScript: async () => undefined })
    expect(result).toMatchObject({ status: 'failed', reason: 'script' })
  })

  it('fails with "timeout" when the host never answers appinfo', async () => {
    installFakeSdk(() => new Promise(() => undefined))
    const result = await connect({
      ...base,
      inIframe: true,
      loadScript: async () => undefined,
      initTimeoutMs: 5,
    })
    expect(result).toMatchObject({ status: 'failed', reason: 'timeout' })
  })
})

describe('loadScript', () => {
  interface FakeScript {
    src?: string
    async?: boolean
    onload: (() => void) | null
    onerror: (() => void) | null
    remove: () => void
  }

  function fakeDocument() {
    const script: FakeScript = { onload: null, onerror: null, remove: vi.fn() }
    const doc = {
      createElement: () => script,
      head: { appendChild: vi.fn() },
    } as unknown as Document
    return { doc, script }
  }

  it('appends an async script and resolves on load', async () => {
    const { doc, script } = fakeDocument()
    const promise = loadScript('https://bastyon.com/js/lib/apps/sdk.js', 1000, doc)
    expect(doc.head.appendChild).toHaveBeenCalledWith(script)
    expect(script.src).toBe('https://bastyon.com/js/lib/apps/sdk.js')
    expect(script.async).toBe(true)
    script.onload?.()
    await expect(promise).resolves.toBeUndefined()
  })

  it('rejects and removes the script on error', async () => {
    const { doc, script } = fakeDocument()
    const promise = loadScript('https://x/sdk.js', 1000, doc)
    script.onerror?.()
    await expect(promise).rejects.toThrow('sdk_script_error')
    expect(script.remove).toHaveBeenCalled()
  })

  it('rejects on timeout', async () => {
    const { doc } = fakeDocument()
    await expect(loadScript('https://x/sdk.js', 5, doc)).rejects.toThrow('sdk_script_timeout')
  })
})

describe('helpers', () => {
  it('builds the sdk.js address', () => {
    expect(sdkScriptUrl('test.pocketnet.app')).toBe('https://test.pocketnet.app/js/lib/apps/sdk.js')
  })

  it('withTimeout passes values and errors through', async () => {
    await expect(withTimeout(Promise.resolve(1), 100, 'late')).resolves.toBe(1)
    await expect(withTimeout(Promise.reject(new Error('boom')), 100, 'late')).rejects.toThrow(
      'boom'
    )
    await expect(withTimeout(new Promise(() => undefined), 5, 'late')).rejects.toThrow('late')
  })
})

describe('isInIframe', () => {
  it('a page of its own is not framed; a frame is, even a cross-origin one', () => {
    const own = { self: 1, top: 1 } as unknown as Window
    expect(isInIframe(own)).toBe(false)
    const framed = { self: 1, top: 2 } as unknown as Window
    expect(isInIframe(framed)).toBe(true)
    // Reading `top` of another origin throws: that is a frame too.
    const foreign = {
      self: 1,
      get top(): Window {
        throw new DOMException('Blocked a frame', 'SecurityError')
      },
    } as unknown as Window
    expect(isInIframe(foreign)).toBe(true)
  })
})
