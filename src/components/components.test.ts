import { afterEach, describe, expect, it } from 'vitest'
import { mountUi } from '@/test/mount'
import NetStatusBadge from './net/NetStatusBadge.vue'
import TxPanel from './net/TxPanel.vue'
import ExchangeList from './offer/ExchangeList.vue'
import OfferCard from './offer/OfferCard.vue'
import PriceTag from './offer/PriceTag.vue'

const plain = (s: string) => s.replace(/\s+/g, ' ').trim()

afterEach(() => {
  document.body.innerHTML = ''
})

describe('PriceTag', () => {
  it('shows PKOIN and the equivalent', () => {
    const w = mountUi(PriceTag, {
      props: { price: { pkoin: 1250, equivalent: { amount: 12400, currency: 'RUB' } } },
    })
    expect(plain(w.text())).toBe('1 250 PKOIN ≈ 12 400 ₽')
  })

  it('shows only PKOIN without a rate (principle 04: never hide the price)', () => {
    const w = mountUi(PriceTag, { props: { price: { pkoin: 420, equivalent: null } } })
    expect(plain(w.text())).toBe('420 PKOIN')
  })

  it('«от» and «Бесплатно»', () => {
    expect(plain(mountUi(PriceTag, { props: { price: { pkoin: 3100, from: true } } }).text())).toBe(
      'от 3 100 PKOIN'
    )
    const free = mountUi(PriceTag, { props: { price: { free: true, pkoin: 10 } } })
    expect(free.text()).toBe('Бесплатно')
    expect(free.classes()).toContain('price--free')
  })

  it('follows the locale', () => {
    const w = mountUi(PriceTag, {
      locale: 'en',
      props: { price: { pkoin: 3100, from: true, equivalent: { amount: 42.5, currency: 'USD' } } },
    })
    expect(plain(w.text())).toBe('from 3,100 PKOIN ≈ $42.50')
  })
})

describe('ExchangeList', () => {
  const items = [
    { label: 'Самокаты', category: true, to: { name: 'category', params: { id: '1' } } },
    { label: 'Ролики', category: true },
    { label: 'Палатка' },
    { label: 'Гитара', category: true },
  ]

  it('inline: two items and «+N»', () => {
    const w = mountUi(ExchangeList, { props: { items } })
    expect(plain(w.text())).toBe('Меняю на: Самокаты, Ролики +2')
    expect(w.find('a').attributes('href')).toBe('/category/1')
  })

  it('«что-нибудь» when anything goes', () => {
    const w = mountUi(ExchangeList, { props: { anything: true } })
    expect(plain(w.text())).toBe('Меняю на: что-нибудь')
  })

  it('block: free text is grey, a match has a check and a hint', () => {
    const w = mountUi(ExchangeList, {
      props: {
        variant: 'block',
        items: [{ label: 'Планшеты', category: true, match: true }, { label: 'Приставка' }],
      },
    })
    const tags = w.findAll('.xl__tag')
    expect(tags[0]!.classes()).toContain('xl__tag--match')
    expect(tags[0]!.text()).toContain('подходит к вашему объявлению')
    expect(tags[1]!.classes()).toContain('xl__tag--free')
  })
})

describe('NetStatusBadge', () => {
  it.each([
    ['sending', 'Отправляем на ноду'],
    ['done', 'В сети'],
    ['draft', 'Черновик · не в сети'],
  ] as const)('%s → %s', (status, text) => {
    expect(mountUi(NetStatusBadge, { props: { status } }).text()).toBe(text)
  })

  it('waiting shows the estimate', () => {
    expect(mountUi(NetStatusBadge, { props: { status: 'waiting', eta: '~1 мин' } }).text()).toBe(
      'Ждём блок · ~1 мин'
    )
  })

  it('failed offers a retry', async () => {
    const w = mountUi(NetStatusBadge, { props: { status: 'failed' } })
    await w.find('button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })
})

describe('TxPanel', () => {
  it('marks the current step and tells the state to screen readers', () => {
    const w = mountUi(TxPanel, {
      props: {
        title: 'Публикуем объявление',
        steps: [
          { label: 'Подписано', detail: 'tx 3a9f…c41e', mono: true, state: 'done' },
          { label: 'Ждём блок', state: 'active' },
          { label: 'В сети', state: 'pending' },
        ],
      },
    })
    const steps = w.findAll('.tx__step')
    expect(steps[1]!.attributes('aria-current')).toBe('step')
    expect(steps[0]!.text()).toContain('готово')
    expect(steps[1]!.text()).toContain('выполняется')
    expect(w.find('.t-mono').text()).toBe('tx 3a9f…c41e')
  })
})

describe('OfferCard', () => {
  const base = {
    id: '1',
    to: { name: 'barterItem', params: { id: 'a'.repeat(64) } },
    title: 'Велосипед городской',
    price: { pkoin: 420 },
    place: 'Таганская',
    time: '2 часа назад',
  }

  it('links the title and toggles the favourite', async () => {
    const w = mountUi(OfferCard, { props: { offer: base } })
    expect(w.find('a.card__title').attributes('href')).toBe(`/barter/${'a'.repeat(64)}`)
    expect(w.text()).toContain('Таганская · 2 часа назад')
    const fav = w.find('button[aria-pressed]')
    expect(fav.attributes('aria-label')).toBe('В избранное')
    await fav.trigger('click')
    expect(w.emitted('favorite')).toHaveLength(1)
  })

  it('pending: no link, no favourite, an overlay and the note', () => {
    const w = mountUi(OfferCard, {
      props: { offer: { ...base, state: 'pending', stateNote: 'Ждём подтверждения · ~1 мин' } },
    })
    expect(w.find('a.card__title').exists()).toBe(false)
    expect(w.find('button[aria-pressed]').exists()).toBe(false)
    expect(w.text()).toContain('Публикуется в сети')
    expect(w.text()).toContain('Ждём подтверждения · ~1 мин')
  })

  it('inactive: the label on the photo and the note instead of the place', () => {
    const w = mountUi(OfferCard, {
      props: {
        offer: {
          ...base,
          state: 'inactive',
          stateLabel: 'Срок публикации истёк',
          stateNote: 'Снято 12 октября',
        },
      },
    })
    expect(w.text()).toContain('Срок публикации истёк')
    expect(w.text()).toContain('Снято 12 октября')
    expect(w.text()).not.toContain('Таганская')
  })
})
