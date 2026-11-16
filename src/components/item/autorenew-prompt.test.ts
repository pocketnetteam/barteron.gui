import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { markRaw, nextTick } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { keys } from '@/api/queries'
import { i18n, setLocale } from '@/i18n'
import { offerFromAlias, type Offer } from '@/models/offer'
import { createAppRouter } from '@/router'
import { createMockSdk, MOCK_ADDRESS } from '@/sdk/mock'
import { useSessionStore } from '@/stores/session'
import { useTxStore } from '@/stores/tx'
import { toasts } from '@/ui/toast'
import AutorenewPrompt from './AutorenewPrompt.vue'

const OTHER = 'POther'.padEnd(34, '2')
const DAY = 86_400_000

/** An offer of `address` whose year runs out in five days. */
function due(address: string, label: string, patch: Record<string, unknown> = {}): Offer {
  const hash = Array.from(label, (c) => c.charCodeAt(0).toString(16))
    .join('')
    .padEnd(64, 'e')
    .slice(0, 64)
  return offerFromAlias(
    {
      hash,
      address,
      language: 'ru-RU',
      caption: label,
      description: 'Описание',
      tag: 1006,
      tags: [17],
      condition: 'used',
      images: [],
      geohash: 'srywc8m3qz2k',
      price: 100,
      published: 'published',
      ...patch,
    },
    hash,
    Date.now() - 360 * DAY
  )!
}

async function setup(offers: Record<string, Offer[]>) {
  localStorage.clear()
  const pinia = createPinia()
  setActivePinia(pinia)
  void setLocale('ru')
  const sdk = createMockSdk()
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.appinfo = await sdk.get.appinfo()
  session.account = 'signed-in'
  session.address = MOCK_ADDRESS
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  for (const [address, list] of Object.entries(offers)) {
    client.setQueryData(keys.offersByAddress(address), list)
  }
  const router = createAppRouter(createMemoryHistory())
  await router.push('/')
  const wrapper = mount(AutorenewPrompt, {
    attachTo: document.body,
    global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
  return { session, wrapper, dialog, tx: useTxStore() }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the renewal reminder', () => {
  it('an offer that cannot be sent is not passed over in silence', async () => {
    const { wrapper, dialog, tx } = await setup({
      [MOCK_ADDRESS]: [
        due(MOCK_ADDRESS, 'Наушники'),
        due(MOCK_ADDRESS, 'Колонка', { geohash: '' }),
      ],
    })
    await vi.waitFor(() => expect(dialog()?.textContent).toContain('Колонка'))
    const before = toasts.items.length
    document.querySelector<HTMLElement>('[data-testid="autorenew-confirm"]')!.click()
    await flushPromises()
    expect(tx.items).toHaveLength(1)
    expect(toasts.items.slice(before).map((t) => [t.kind, t.text])).toEqual([
      ['info', 'Отправили 1 продление'],
      ['error', 'Не продлено: «Колонка» — в нём не хватает данных. Откройте на редактирование.'],
    ])
    wrapper.unmount()
  })

  it('another account in the same visit: asked about its own offers, not shown the first one’s', async () => {
    const { session, wrapper, dialog } = await setup({
      [MOCK_ADDRESS]: [due(MOCK_ADDRESS, 'Наушники')],
      [OTHER]: [due(OTHER, 'Самокат')],
    })
    await vi.waitFor(() => expect(dialog()?.textContent).toContain('Наушники'))
    // The first account puts it off; the second has not been asked yet.
    const later = [...dialog()!.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Не сейчас')
    )!
    later.click()
    await vi.waitFor(() => expect(dialog()).toBeNull())
    session.address = OTHER
    await nextTick()
    await vi.waitFor(() => expect(dialog()?.textContent).toContain('Самокат'))
    expect(dialog()!.textContent).not.toContain('Наушники')
    wrapper.unmount()
  })

  it('switched to an account with nothing to renew: the first one’s list goes away', async () => {
    const { session, wrapper, dialog } = await setup({
      [MOCK_ADDRESS]: [due(MOCK_ADDRESS, 'Наушники')],
      [OTHER]: [],
    })
    await vi.waitFor(() => expect(dialog()?.textContent).toContain('Наушники'))
    session.address = OTHER
    await vi.waitFor(() => expect(dialog()).toBeNull())
    wrapper.unmount()
  })
})
