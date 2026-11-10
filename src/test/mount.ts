import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import type { Component } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { i18n, setLocale, type Locale } from '@/i18n'
import { createAppRouter } from '@/router'

/** Mounts a component with i18n and a memory router, like the app does. */
export function mountUi<C extends Component>(
  component: C,
  options: ComponentMountingOptions<C> & { locale?: Locale } = {}
) {
  setLocale(options.locale ?? 'ru')
  const router = createAppRouter(createMemoryHistory())
  const { global, ...rest } = options
  return mount(component, {
    attachTo: document.body,
    ...rest,
    global: { ...global, plugins: [i18n, router, ...(global?.plugins ?? [])] },
  } as ComponentMountingOptions<C>)
}
