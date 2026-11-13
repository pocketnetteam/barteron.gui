import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n, setLocale } from '@/i18n'
import { hexEncode } from '@/config/links'
import { useSessionStore } from '@/stores/session'
import App from './App.vue'

async function show(path: string, status: 'outside' | 'failed') {
  const pinia = createPinia()
  setActivePinia(pinia)
  setLocale('ru')
  const page = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: page }],
  })
  await router.push(path)
  const session = useSessionStore()
  session.status = status
  session.failReason = 'timeout'
  const wrapper = mount(App, { global: { plugins: [pinia, i18n, router] } })
  await flushPromises()
  return wrapper
}

describe('opened outside Bastyon, or Bastyon did not answer', () => {
  it('«Открыть в Bastyon» goes on to the same page, not to the start', async () => {
    const path = 'barter/0123456789abcdef?view=buyer'
    const link = `https://bastyon.com/application?id=barteron.pocketnet.app&p=${hexEncode(path)}`
    const outside = await show(`/${path}`, 'outside')
    expect(outside.get('[data-testid="state-outside"] a').attributes('href')).toBe(link)
    outside.unmount()

    const failed = await show(`/${path}`, 'failed')
    const hrefs = failed.findAll('[data-testid="state-failed"] a').map((a) => a.attributes('href'))
    expect(hrefs).toContain(link)
    failed.unmount()

    const home = await show('/', 'outside')
    expect(home.get('[data-testid="state-outside"] a').attributes('href')).toBe(
      'https://bastyon.com/application?id=barteron.pocketnet.app'
    )
    home.unmount()
  })
})
