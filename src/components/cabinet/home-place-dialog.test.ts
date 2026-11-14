import { flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import { mountUi } from '@/test/mount'
import HomePlaceDialog from './HomePlaceDialog.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the place for new offers', () => {
  it('«Изменить» opens on the place saved before: «Сохранить» keeps it, «Отмена» saves nothing', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    // The settings mount the dialog already open.
    const w = mountUi(HomePlaceDialog, {
      props: { geohash: 'ucfv0n1h4s3k', open: true },
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient: new QueryClient() }]] },
    })
    await flushPromises()
    const save = document.querySelector<HTMLButtonElement>('[data-testid="home-place-save"]')!
    expect(save.disabled).toBe(false)
    save.click()
    await flushPromises()
    expect(w.emitted('save')).toEqual([['ucfv0n1h4s3k']])
    w.unmount()

    const cancel = mountUi(HomePlaceDialog, {
      props: { geohash: 'ucfv0n1h4s3k', open: true },
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient: new QueryClient() }]] },
    })
    await flushPromises()
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')]
    buttons.find((b) => b.textContent?.trim() === 'Отмена')!.click()
    await flushPromises()
    expect(cancel.emitted('save')).toBeUndefined()
    expect(cancel.emitted('update:open')).toEqual([[false]])
    cancel.unmount()
  })
})
