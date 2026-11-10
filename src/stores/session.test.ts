import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/i18n'
import { createMockSdk, MOCK_ADDRESS, type MockOptions, type MockSdk } from '@/sdk/mock'
import { useSdk, useSessionStore } from './session'

function startWithMock(options: MockOptions = {}): { sdk: MockSdk; started: Promise<void> } {
  const sdk = createMockSdk(options)
  const started = useSessionStore().start({
    sdkHost: 'bastyon.com',
    allowMock: true,
    inIframe: false,
    createMock: () => sdk,
  })
  return { sdk, started }
}

beforeEach(() => {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'en'
})

describe('session store', () => {
  it('connects and reads the address', async () => {
    const { sdk, started } = startWithMock({ locale: 'ru', theme: 'dark' })
    expect(useSessionStore().status).toBe('connecting')
    await started

    const session = useSessionStore()
    expect(session.status).toBe('ready')
    expect(session.mode).toBe('mock')
    expect(session.account).toBe('signed-in')
    expect(session.address).toBe(MOCK_ADDRESS)
    expect(session.hostTheme).toBe('dark')
    expect(i18n.global.locale.value).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')
    // bastyon-nextgen keeps its splash over the app until `loaded`.
    expect(sdk.mock.calls.some((c) => c.method === 'emit' && c.args[0] === 'loaded')).toBe(true)
  })

  it('falls back to English for a host locale we do not have', async () => {
    i18n.global.locale.value = 'ru'
    await startWithMock({ locale: 'de' }).started
    expect(i18n.global.locale.value).toBe('en')
  })

  it('asks for the account permission and then reads the address', async () => {
    const { sdk, started } = startWithMock({ granted: [] })
    await started
    const session = useSessionStore()
    expect(session.account).toBe('no-permission')
    expect(session.address).toBeNull()

    await session.requestAccountAccess()
    expect(sdk.mock.calls.some((c) => c.method === 'permissions.request')).toBe(true)
    expect(session.account).toBe('signed-in')
    expect(session.address).toBe(MOCK_ADDRESS)
  })

  it('stays without access if the user declines the prompt', async () => {
    const { started } = startWithMock({ granted: [], grantOnRequest: false })
    await started
    const session = useSessionStore()
    await session.requestAccountAccess()
    expect(session.account).toBe('no-permission')
  })

  it('marks a guest when nobody is signed in to Bastyon', async () => {
    await startWithMock({ address: null }).started
    expect(useSessionStore().account).toBe('guest')
  })

  it('follows theme and locale changes pushed by the host', async () => {
    const { sdk, started } = startWithMock({ locale: 'en', theme: 'light' })
    await started
    sdk.mock.push('theme', { rootid: 'dark' })
    sdk.mock.push('locale', { locale: 'sr' })
    expect(useSessionStore().hostTheme).toBe('dark')
    expect(i18n.global.locale.value).toBe('sr')
  })

  it('reports the failure reason when sdk.js does not load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await useSessionStore().start({
      sdkHost: 'bastyon.com',
      allowMock: false,
      inIframe: true,
      loadScript: async () => {
        throw new Error('sdk_script_error')
      },
    })
    const session = useSessionStore()
    expect(session.status).toBe('failed')
    expect(session.failReason).toBe('script')
  })

  it('useSdk() throws until connected and returns the SDK after', async () => {
    expect(() => useSdk()).toThrow('sdk_not_ready')
    const { sdk, started } = startWithMock()
    await started
    expect(useSdk()).toBe(sdk)
  })
})
