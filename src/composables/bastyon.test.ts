import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { i18n, setLocale } from '@/i18n'
import { createMockSdk } from '@/sdk/mock'
import { useSessionStore } from '@/stores/session'
import { dismissAll, toasts } from '@/ui/toast'
import { useBastyonProfile } from './bastyon'

const ADDRESS = 'PMdhZ1gvZXAXmQ6z5ghHz86arfXorxNYgX'

function setup(open: ((kind: string, value: string) => Promise<unknown>) | null) {
  const pinia = createPinia()
  setActivePinia(pinia)
  void setLocale('ru')
  const sdk = createMockSdk()
  if (open) sdk.open.profile = open
  else (sdk as { open: { profile?: unknown } }).open.profile = undefined
  useSessionStore().sdk = markRaw(sdk)
  let openProfile!: ReturnType<typeof useBastyonProfile>
  mount(
    defineComponent({
      setup() {
        openProfile = useBastyonProfile()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n] } }
  )
  return openProfile
}

describe('a profile in Bastyon', () => {
  beforeEach(() => dismissAll())

  it('the previous host: by the name, as the old app asked', async () => {
    const open = vi.fn(async () => undefined)
    await setup(open)(ADDRESS, 'ivan')
    expect(open.mock.calls).toEqual([['username', 'ivan']])
  })

  it('bastyon-nextgen does not know the name: then by the address', async () => {
    const open = vi.fn(async (kind: string) => {
      if (kind === 'username') throw new Error('unknown')
    })
    await setup(open)(ADDRESS, 'ivan')
    expect(open.mock.calls).toEqual([
      ['username', 'ivan'],
      ['address', ADDRESS],
    ])
    expect(toasts.items).toEqual([])
  })

  it('no name: by the address; the host refusing or lacking it says so', async () => {
    const open = vi.fn(async () => {
      throw new Error('closed')
    })
    await setup(open)(ADDRESS, null)
    expect(open.mock.calls).toEqual([['address', ADDRESS]])
    expect(toasts.items.at(-1)).toMatchObject({ kind: 'error' })
    dismissAll()
    await setup(null)(ADDRESS)
    expect(toasts.items.at(-1)).toMatchObject({ kind: 'error' })
  })
})
