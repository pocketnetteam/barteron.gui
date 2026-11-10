import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mountUi } from '@/test/mount'
import UiButton from './UiButton.vue'
import UiDialog from './UiDialog.vue'
import UiField from './UiField.vue'
import UiInput from './UiInput.vue'
import UiRating from './UiRating.vue'
import UiSelect from './UiSelect.vue'
import UiTabs from './UiTabs.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('UiButton', () => {
  it('is a <button type=button> by default', () => {
    const w = mountUi(UiButton, { slots: { default: 'Купить' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('type')).toBe('button')
    expect(w.classes()).toContain('ui-button--primary')
  })

  it('renders a router link for `to`', async () => {
    const w = mountUi(UiButton, {
      props: { to: { name: 'about' } },
      slots: { default: 'О проекте' },
    })
    await flushPromises()
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/about')
  })

  it('is disabled and busy while loading', () => {
    const w = mountUi(UiButton, { props: { loading: true }, slots: { default: 'Отправка…' } })
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.find('.ui-spinner').exists()).toBe(true)
  })

  it('icon-only buttons carry their name in aria-label', () => {
    const w = mountUi(UiButton, { props: { icon: 'close', label: 'Закрыть' } })
    expect(w.classes()).toContain('ui-button--icon-only')
    expect(w.attributes('aria-label')).toBe('Закрыть')
  })

  it('marks a way out to Bastyon with ↗ and a hint', () => {
    const w = mountUi(UiButton, {
      props: { external: true },
      slots: { default: 'Написать продавцу' },
    })
    expect(w.text()).toContain('(откроется в Bastyon)')
  })
})

describe('UiField + UiInput', () => {
  it('links the label, the hint and the error to the input', () => {
    const w = mountUi(UiField, {
      props: { label: 'Цена', error: 'Укажите цену' },
      slots: { default: () => h(UiInput, { suffix: 'PKOIN' }) },
    })
    const input = w.find('input')
    const label = w.find('label')
    expect(label.attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-invalid')).toBe('true')
    const hint = w.find(`#${input.attributes('aria-describedby')}`)
    expect(hint.text()).toContain('Укажите цену')
    expect(w.text()).toContain('PKOIN')
  })

  it('shows the counter', () => {
    const w = mountUi(UiField, {
      props: { label: 'Название', count: 24, max: 80 },
      slots: { default: () => h(UiInput) },
    })
    expect(w.text()).toContain('24 / 80')
  })

  it('updates v-model', async () => {
    const value = ref('')
    const w = mountUi(
      defineComponent({
        setup: () => () =>
          h(UiInput, {
            modelValue: value.value,
            'onUpdate:modelValue': (v: string | number) => (value.value = String(v)),
          }),
      })
    )
    await w.find('input').setValue('Велосипед')
    expect(value.value).toBe('Велосипед')
  })
})

describe('UiSelect', () => {
  const options = [
    { value: 'new', label: 'Сначала новые' },
    { value: 'old', label: 'Сначала старые' },
    { value: 'cheap', label: 'Сначала дешёвые' },
  ]

  it('opens with the keyboard and picks with Enter', async () => {
    const w = mountUi(UiSelect, { props: { options, modelValue: 'new', label: 'Сортировка' } })
    const trigger = w.find('[role=combobox]')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    await trigger.trigger('keydown', { key: 'ArrowDown' })
    expect(trigger.attributes('aria-expanded')).toBe('true')
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await trigger.trigger('keydown', { key: 'Enter' })

    expect(w.emitted('update:modelValue')?.[0]).toEqual(['old'])
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('closes on Escape without changing the value', async () => {
    const w = mountUi(UiSelect, { props: { options, modelValue: 'new' } })
    const trigger = w.find('[role=combobox]')
    await trigger.trigger('click')
    await trigger.trigger('keydown', { key: 'Escape' })
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('marks the selected option', () => {
    const w = mountUi(UiSelect, { props: { options, modelValue: 'cheap' } })
    expect(w.find('[aria-selected=true]').text()).toBe('Сначала дешёвые')
    expect(w.find('[role=combobox]').text()).toBe('Сначала дешёвые')
  })
})

describe('UiTabs', () => {
  it('moves with arrow keys', async () => {
    const w = mountUi(UiTabs, {
      props: {
        modelValue: 'a',
        items: [
          { value: 'a', label: 'Активные', count: 12 },
          { value: 'b', label: 'Неактивные', count: 3 },
        ],
      },
    })
    const tabs = w.findAll('[role=tab]')
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
    expect(tabs[0]!.text()).toContain('12')
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })
})

describe('UiDialog', () => {
  function mountDialog(closable = true) {
    const open = ref(true)
    const w = mountUi(
      defineComponent({
        setup: () => () =>
          h(
            UiDialog,
            {
              title: 'Снять с публикации?',
              open: open.value,
              closable,
              'onUpdate:open': (v: boolean) => (open.value = v),
            },
            {
              default: () => h('p', 'Объявление исчезнет из поиска'),
              actions: () => [
                h('button', { id: 'cancel' }, 'Отмена'),
                h('button', { id: 'ok' }, 'Снять'),
              ],
            }
          ),
      })
    )
    return { w, open }
  }

  it('is a labelled modal dialog', async () => {
    mountDialog()
    await nextTick()
    const dialog = document.querySelector('[role=dialog]')!
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!)
    expect(title?.textContent).toBe('Снять с публикации?')
  })

  it('closes on Escape', async () => {
    const { open } = mountDialog()
    await nextTick()
    document
      .querySelector('.ui-dialog')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(open.value).toBe(false)
  })

  it('stays open on Escape when not closable', async () => {
    const { open } = mountDialog(false)
    await nextTick()
    document
      .querySelector('.ui-dialog')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(open.value).toBe(true)
    expect(document.querySelector('.ui-dialog__close')).toBeNull()
  })

  it('focuses the first action, not the ×', async () => {
    mountDialog()
    await nextTick()
    await nextTick()
    expect(document.activeElement?.id).toBe('cancel')
  })

  it('keeps Tab inside', async () => {
    mountDialog()
    await nextTick()
    await nextTick()
    const ok = document.getElementById('ok')!
    ok.focus()
    ok.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    // Wraps to the first focusable element: the × button.
    expect(document.activeElement?.classList.contains('ui-dialog__close')).toBe(true)
  })
})

describe('UiRating', () => {
  it('formats the value and pluralises reviews in Russian', () => {
    const w = mountUi(UiRating, { props: { value: 4.8, count: 23 } })
    expect(w.text()).toContain('4,8')
    expect(w.text()).toContain('23 отзыва')
    expect(w.find('[role=img]').attributes('aria-label')).toBe('Рейтинг 4,8 из 5')
  })

  it.each([
    [1, '1 отзыв'],
    [5, '5 отзывов'],
    [41, '41 отзыв'],
  ])('%d → %s', (count, text) => {
    const w = mountUi(UiRating, { props: { value: 5, count } })
    expect(w.text()).toContain(text)
  })

  it('fills the last star partly', () => {
    const w = mountUi(UiRating, { props: { value: 4.5 } })
    const fills = w.findAll('.ui-rating__star-fill').map((el) => el.attributes('style'))
    expect(fills[3]).toContain('width: 100%')
    expect(fills[4]).toContain('width: 50%')
  })
})
