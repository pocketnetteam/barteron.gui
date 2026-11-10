import type { OfferCardData } from '@/components/offer/types'

/** Demo content for the showcase: the same offers as on the marketplace sheet. */

const HASH = '0'.repeat(64)
const item = { name: 'barterItem', params: { id: HASH } }
const category = (id: string) => ({ name: 'category', params: { id } })
const RUB = (amount: number) => ({ amount, currency: 'RUB' })

export const DEMO_CARDS: { caption: string; offer: OfferCardData }[] = [
  {
    caption: 'Обычная',
    offer: {
      id: '1',
      to: item,
      title: 'Велосипед городской Stels Navigator',
      photoCount: 3,
      price: { pkoin: 420, equivalent: RUB(4200) },
      exchange: [
        { label: 'Самокаты', to: category('1'), category: true },
        { label: 'Ролики', to: category('2'), category: true },
        { label: 'Палатка на 2 человек' },
        { label: 'Гитара', category: true },
      ],
      place: 'Таганская',
      time: '2 часа назад',
      rating: 4.6,
    },
  },
  {
    caption: 'Бесплатно · в избранном',
    offer: {
      id: '2',
      to: item,
      title: 'Детские книги, 14 штук',
      price: { free: true },
      exchangeAnything: true,
      condition: 'used',
      favorite: true,
      place: 'Сокольники',
      time: 'вчера',
    },
  },
  {
    caption: 'Совпадение с моими обменами · видео',
    offer: {
      id: '3',
      to: item,
      title: 'Смартфон, 128 ГБ, синий',
      price: { pkoin: 3100, from: true },
      exchange: [{ label: 'Ноутбуки', to: category('3'), category: true }],
      match: true,
      videoDuration: '0:42',
      safeDeal: true,
      time: '3 дня назад',
    },
  },
  {
    caption: 'Публикуется (оптимистично)',
    offer: {
      id: '4',
      title: 'Скворечник ручной работы',
      price: { pkoin: 90, equivalent: RUB(900) },
      state: 'pending',
      stateNote: 'Ждём подтверждения · ~1 мин',
    },
  },
  {
    caption: 'Неактивное',
    offer: {
      id: '5',
      to: item,
      title: 'Сумка дорожная',
      price: { pkoin: 150 },
      state: 'inactive',
      stateLabel: 'Срок публикации истёк',
      stateNote: 'Снято 12 октября',
    },
  },
]

export const DEMO_ROW: OfferCardData = {
  id: '6',
  to: item,
  title: 'Велосипед городской Stels Navigator',
  price: { pkoin: 420, equivalent: RUB(4200) },
  exchange: [
    { label: 'Самокаты', to: category('1'), category: true },
    { label: 'Ролики', to: category('2'), category: true },
    { label: 'Палатка на 2 человек' },
  ],
  description:
    'Рама алюминиевая, 7 скоростей, крылья и багажник. Пользовался аккуратно, хранился в квартире. Возможен обмен с доплатой.',
  place: 'Москва, Таганская · 3,2 км',
  time: '2 часа назад',
  delivery: true,
}

export const DEMO_MINI = [
  { title: 'Велосипед городской', price: { pkoin: 420 } },
  { title: 'Детские книги', price: { free: true } },
  { title: 'Смартфон 128 ГБ', price: { pkoin: 3100 } },
]

export const DEMO_ITEM = item
