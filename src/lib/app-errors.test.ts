import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { setLocale } from '@/i18n'
import { dismissAll, toasts } from '@/ui/toast'
import { installErrorHandler } from './app-errors'

/** Stage 27: a bug that escapes a component reaches the user, not only the console. */
function mountButton(onClick: () => unknown) {
  const app = createApp(
    defineComponent({ setup: () => () => h('button', { onClick }, 'Снять с публикации') })
  )
  installErrorHandler(app)
  const el = document.createElement('div')
  document.body.append(el)
  app.mount(el)
  return { button: el.querySelector('button')!, unmount: () => (app.unmount(), el.remove()) }
}

const errorToasts = () => toasts.items.filter((t) => t.kind === 'error').map((t) => t.text)

beforeEach(() => {
  setLocale('ru')
  dismissAll()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => dismissAll())

describe('an error nothing caught', () => {
  it('a click handler that throws: the user is told, the console keeps the details', () => {
    const { button, unmount } = mountButton(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'hash')")
    })
    button.click()
    expect(errorToasts()).toEqual([
      'Что-то пошло не так. Попробуйте ещё раз, а если не выйдет — перезапустите приложение',
    ])
    expect(console.error).toHaveBeenCalled()
    unmount()
  })

  it('an async handler that rejects is told the same way', async () => {
    const { button, unmount } = mountButton(() => Promise.reject(new Error('host went away')))
    button.click()
    await nextTick()
    await Promise.resolve()
    expect(errorToasts()).toHaveLength(1)
    unmount()
  })

  it('one toast for a run of errors; another once it is closed', () => {
    const { button, unmount } = mountButton(() => {
      throw new Error('again')
    })
    button.click()
    button.click()
    button.click()
    expect(errorToasts()).toHaveLength(1)
    dismissAll()
    button.click()
    expect(errorToasts()).toHaveLength(1)
    unmount()
  })

  it('a piece of the app that did not load is «Вышла новая версия», not this toast', () => {
    const { button, unmount } = mountButton(() => {
      throw new TypeError('Failed to fetch dynamically imported module: /assets/AboutView.js')
    })
    button.click()
    expect(errorToasts()).toEqual([])
    unmount()
  })
})
