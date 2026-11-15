import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import type { useMyAccount } from '@/composables/my-account'
import { mountUi } from '@/test/mount'
import MyListCard from './MyListCard.vue'

/** My profile as `useMyAccount` gives it, with the node failing to answer. */
function failedAccount() {
  const refetch = vi.fn(async () => undefined)
  const account = {
    query: { isError: ref(true), isPending: ref(false), data: ref(undefined), refetch },
    shown: computed(() => null),
    pending: computed(() => false),
    failed: computed(() => null),
    activating: computed(() => false),
    canSave: computed(() => false),
    save: vi.fn(() => null),
    retry: vi.fn(),
    dismiss: vi.fn(),
  }
  return { account: account as unknown as ReturnType<typeof useMyAccount>, refetch }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('my profile did not come from the node', () => {
  it('«Мой список» says so with a retry, not «список пуст»; nothing can be saved', async () => {
    setActivePinia(createPinia())
    const { account, refetch } = failedAccount()
    const w = mountUi(MyListCard, {
      props: { account },
      global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
    })
    const notice = w.get('[data-testid="account-load-failed"]')
    expect(notice.text()).toContain('Профиль Barteron не загрузился')
    expect(w.text()).not.toContain('Список пуст')
    // An unknown list is not saved over the one on chain.
    expect(w.get('[data-testid="mylist-save"]').attributes('disabled')).toBeDefined()
    await notice.get('button').trigger('click')
    expect(refetch).toHaveBeenCalled()
    w.unmount()
  })
})
