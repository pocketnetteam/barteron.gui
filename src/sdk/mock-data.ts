/**
 * Demo content for the mock network: a dozen offers around Belgrade and
 * Moscow, their sellers, scores and reviews. Category ids are real; addresses,
 * names and txids are made up.
 */

import { encodeGeohash } from '@/lib/geohash'
import { TX_TYPE, type JsonObject, type RawTx } from '@/models/tx'
import type { MockNetworkData } from './mock-network'

/** Made-up address of the right length. */
const demoAddress = (name: string) => `PDemo${name}`.padEnd(34, '1')

/** Made-up txid from a short label. */
const demoTxid = (label: string) =>
  Array.from(label)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(64, 'a')
    .slice(0, 64)

/** A soft gradient as a photo stand-in: no network in the mock. */
const demoPhoto = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 60% 78%)"/><stop offset="1" stop-color="hsl(${hue + 40} 55% 58%)"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/></svg>`
  )}`

const BELGRADE: [number, number] = [44.8125, 20.4612]
const MOSCOW: [number, number] = [55.7522, 37.6156]
const near = ([lat, lng]: [number, number], i: number): [number, number] => [
  lat + Math.sin(i * 1.7) * 0.03,
  lng + Math.cos(i * 1.3) * 0.04,
]

export const SELLERS = {
  anna: demoAddress('AnnaKovaeva'),
  ilya: demoAddress('IyaPetrov'),
  maria: demoAddress('MariaV'),
  dmitry: demoAddress('DmitryK'),
} as const

interface DemoOffer {
  id: string
  author: string
  caption: string
  description: string
  tag: number
  tags: (number | string)[]
  condition?: 'new' | 'used'
  price: number
  place: [number, number]
  photos?: number[]
  ageHours: number
  published?: string
  currencyPrice?: JsonObject
  metaData?: JsonObject
  safeDeal?: JsonObject
  delivery?: JsonObject
}

function offerTx(o: DemoOffer, now: number, height: number): RawTx {
  const time = Math.floor(now / 1000 - o.ageHours * 3600)
  return {
    hash: o.id,
    type: TX_TYPE.offer,
    height: height - Math.round(o.ageHours * 60),
    time,
    s1: o.author,
    s2: o.id,
    p: {
      s1: 'ru-RU',
      s2: o.caption,
      s3: o.description,
      s4: JSON.stringify({
        t: o.tag,
        a: o.tags,
        c: o.condition ?? 'used',
        p: o.published ?? 'published',
        f: o.currencyPrice ?? {},
        d: o.delivery ?? {},
        v: {},
        s: o.safeDeal ?? {},
        m: o.metaData ?? {},
      }),
      s5: JSON.stringify((o.photos ?? []).map(demoPhoto)),
      s6: encodeGeohash(o.place),
      i1: Math.round(o.price * 100),
    },
  }
}

function accountTx(
  address: string,
  tags: number[],
  place: [number, number],
  rating: number,
  count: number,
  now: number
): RawTx & { additional: JsonObject } {
  return {
    hash: demoTxid(`acc-${address}`),
    type: TX_TYPE.account,
    height: 2_900_000,
    time: Math.floor(now / 1000 - 400 * 24 * 3600),
    s1: address,
    p: {
      s4: JSON.stringify({ a: tags, g: encodeGeohash(place, 6), s: false, r: 10, d: {}, m: {} }),
    },
    additional: {
      regdate: Math.floor(now / 1000 - 500 * 24 * 3600),
      rating: Math.round(rating * 10),
      rating_sum: Math.round(rating * count),
      rating_count: count,
    },
  }
}

/** Demo network content; `me` is the signed-in mock user. */
export function demoNetworkData(me: string, now = Date.now(), height = 3_100_000): MockNetworkData {
  const offers: DemoOffer[] = [
    {
      id: demoTxid('bike'),
      author: SELLERS.ilya,
      caption: 'Велосипед горный, рама M',
      description: 'Shimano Deore, гидравлические тормоза. Катался два сезона, всё обслужено.',
      tag: 1006,
      tags: [58068, 58069],
      price: 3900,
      place: near(BELGRADE, 1),
      photos: [200, 230, 260],
      ageHours: 2,
      safeDeal: { validatorFeeVariant: 'buyer' },
    },
    {
      id: demoTxid('sofa'),
      author: SELLERS.anna,
      caption: 'Диван-кровать, серый',
      description: 'Раскладывается, есть ящик для белья. Самовывоз.',
      tag: 3002,
      tags: ['my_list'],
      price: 1200,
      place: near(BELGRADE, 2),
      photos: [20],
      ageHours: 5,
    },
    {
      id: demoTxid('guitar'),
      author: SELLERS.maria,
      caption: 'Акустическая гитара Yamaha F310',
      description: 'Новые струны, чехол в подарок.',
      tag: 621,
      tags: [],
      price: 950,
      place: near(BELGRADE, 3),
      photos: [30, 60],
      ageHours: 26,
    },
    {
      id: demoTxid('phone'),
      author: SELLERS.dmitry,
      caption: 'Смартфон, 128 ГБ, как новый',
      description: 'Полный комплект, гарантия до весны. Цена в рублях — пересчитается по курсу.',
      tag: 15033,
      tags: [690, 691],
      condition: 'used',
      price: 2400,
      currencyPrice: { currency: 'RUB', price: 24000 },
      place: near(MOSCOW, 1),
      photos: [280],
      ageHours: 30,
      delivery: { deliveryOptions: { selfPickup: { isEnabled: true } } },
    },
    {
      id: demoTxid('books'),
      author: SELLERS.anna,
      caption: 'Кулинарные книги, 6 штук',
      description: 'Отдам даром тому, кто заберёт все сразу.',
      tag: 613,
      tags: ['for_nothing'],
      price: 0,
      place: near(BELGRADE, 4),
      ageHours: 50,
    },
    {
      id: demoTxid('english'),
      author: SELLERS.maria,
      caption: 'Уроки английского онлайн',
      description: 'Разговорный и для экзаменов. Первое занятие бесплатно.',
      tag: 465,
      tags: [621, 622],
      condition: 'new',
      price: 300,
      metaData: { price: { prefix: 'from' } },
      place: near(BELGRADE, 5),
      photos: [160],
      ageHours: 70,
    },
    {
      id: demoTxid('stroller'),
      author: SELLERS.ilya,
      caption: 'Коляска прогулочная',
      description: 'Лёгкая, складывается одной рукой.',
      tag: 3233,
      tags: [1005],
      price: 700,
      place: near(BELGRADE, 6),
      photos: [320],
      ageHours: 96,
    },
    {
      id: demoTxid('coffee'),
      author: SELLERS.dmitry,
      caption: 'Кофемашина рожковая',
      description: 'Работает отлично, перешёл на капсулы.',
      tag: 289,
      tags: [1012],
      price: 1800,
      place: near(MOSCOW, 2),
      photos: [40, 10],
      ageHours: 120,
    },
    {
      id: demoTxid('laptop-mine'),
      author: me,
      caption: 'Ноутбук 14", 16 ГБ',
      description: 'Мой: меняю на горный велосипед.',
      tag: 58068,
      tags: [1006],
      price: 5200,
      place: near(BELGRADE, 7),
      photos: [240],
      ageHours: 10,
    },
    {
      id: demoTxid('tablet-mine'),
      author: me,
      caption: 'Планшет 10"',
      description: 'Снят с публикации.',
      tag: 58069,
      tags: [621],
      price: 1500,
      place: near(BELGRADE, 8),
      ageHours: 300,
      published: 'withdrawed',
    },
  ]

  // A fuller catalog for stage 3 screens: bikes, coins, furniture, books…
  // around both cities, with conditions, delivery ways and safe deals mixed.
  const sellers = [SELLERS.anna, SELLERS.ilya, SELLERS.maria, SELLERS.dmitry]
  const pickup = { deliveryOptions: { selfPickup: { isEnabled: true } } }
  const courier = { deliveryOptions: { directDelivery: { isEnabled: true } } }
  const extra: [string, number, (number | string)[], number, 'new' | 'used', number][] = [
    ['Stels Navigator 300, городской', 1003, [17, 1005], 420, 'used', 2],
    ['Горный Forward Sporting 27,5″', 1006, [17], 480, 'used', 6],
    ['Детский велосипед 16″, с боковыми колёсами', 1005, [17, 2987], 150, 'new', 20],
    ['BMX Stark Madness', 1002, [17, 1004], 350, 'used', 26],
    ['Шоссейный, рама 54, карбоновая вилка', 1004, [17], 490, 'used', 48],
    ['Складной велосипед 20″', 1003, [17], 300, 'new', 52],
    ['Городской с корзиной, женский', 1003, [17], 260, 'used', 75],
    ['Фэтбайк 26″, 7 скоростей', 1006, [17, 890], 470, 'new', 80],
    ['Монета 10 рублей 1993, золото', 38, [17], 1800, 'used', 12],
    ['Серебряный рубль 1924', 13, [17, 38], 640, 'used', 33],
    ['Кресло-качалка из ротанга', 3003, [3002], 650, 'used', 70],
    ['Кровать двуспальная с матрасом', 3004, ['my_list'], 1100, 'used', 90],
    ['Детективы Агаты Кристи, 12 книг', 589, ['for_nothing'], 0, 'used', 30],
    ['Фантастика, серия «Шедевры»', 591, [588], 90, 'used', 100],
    ['Беговая дорожка складная', 890, [1006], 2400, 'used', 28],
    ['Турник настенный', 894, [17], 120, 'new', 40],
    ['Чай пуэр, 5 блинов', 13589, [13590], 60, 'new', 8],
    ['Кофе в зёрнах, 2 кг', 13590, [17], 75, 'new', 15],
    ['Рюкзак школьный ортопедический', 2987, [17], 85, 'new', 44],
    ['Куртка зимняя, размер 48', 11456, [17, 11457], 310, 'used', 60],
    ['Ремонт стиральных машин на дому', 161, [17], 150, 'new', 120],
    ['Телевизор 43″, Smart TV', 658, [17, 15033], 1350, 'used', 18],
  ]
  extra.forEach(([caption, tag, tags, price, condition, ageHours], i) => {
    const city = i % 3 === 2 ? BELGRADE : MOSCOW
    offers.push({
      id: demoTxid(`x${i}-${caption.slice(0, 6)}`),
      author: sellers[i % sellers.length]!,
      caption,
      description: 'Состояние как на фото. Пишите в чат, отвечу быстро.',
      tag,
      tags,
      condition,
      price,
      place: near(city, i + 10),
      photos: i % 4 === 3 ? [] : [(i * 37) % 360],
      ageHours,
      ...(tag === 161 && { metaData: { price: { prefix: 'from' } } }),
      ...(i % 5 === 1 && { safeDeal: { validatorFeeVariant: 'buyer' } }),
      ...(i % 3 === 0 ? { delivery: pickup } : i % 3 === 1 ? { delivery: courier } : {}),
    })
  })

  const scores: RawTx[] = [
    {
      hash: demoTxid('score1'),
      type: TX_TYPE.score,
      time: Math.floor(now / 1000) - 9000,
      height,
      s1: SELLERS.anna,
      s2: offers[0]!.id,
      i1: 5,
    },
    {
      hash: demoTxid('score2'),
      type: TX_TYPE.score,
      time: Math.floor(now / 1000) - 8000,
      height,
      s1: SELLERS.maria,
      s2: offers[0]!.id,
      i1: 4,
    },
  ]
  const comments: RawTx[] = [
    {
      hash: demoTxid('review1'),
      type: TX_TYPE.comment,
      time: Math.floor(now / 1000) - 9000,
      height,
      s1: SELLERS.anna,
      s2: demoTxid('review1'),
      s3: offers[0]!.id,
      p: {
        s1: JSON.stringify({
          message: 'Всё как в описании, спасибо!',
          url: '',
          images: [],
          info: '5',
        }),
      },
    },
  ]

  return {
    offers: offers.map((o) => offerTx(o, now, height)),
    accounts: [
      accountTx(SELLERS.anna, [58068, 15033], BELGRADE, 4.8, 23, now),
      accountTx(SELLERS.ilya, [58068, 58069], BELGRADE, 4.9, 41, now),
      accountTx(SELLERS.maria, [621], BELGRADE, 4.6, 12, now),
      accountTx(SELLERS.dmitry, [690], MOSCOW, 4.4, 8, now),
      accountTx(me, [1006, 621], BELGRADE, 4.7, 5, now),
    ],
    profiles: [
      {
        address: SELLERS.anna,
        name: 'Анна Ковалёва',
        i: '',
        regdate: 1_600_000_000,
        reputation: 120,
      },
      {
        address: SELLERS.ilya,
        name: 'Илья Петров',
        i: '',
        regdate: 1_610_000_000,
        reputation: 340,
      },
      { address: SELLERS.maria, name: 'Мария В.', i: '', regdate: 1_650_000_000, reputation: 40 },
      {
        address: SELLERS.dmitry,
        name: 'Дмитрий К.',
        i: '',
        regdate: 1_660_000_000,
        reputation: 15,
      },
      { address: me, name: 'Вы (заглушка)', i: '', regdate: 1_670_000_000, reputation: 5 },
    ],
    scores,
    comments,
  }
}

/** PKOIN rates for the mock: the app in a plain browser does not call coingecko. */
export const DEMO_RATES: Readonly<Record<string, number>> = {
  USD: 0.0213,
  EUR: 0.0197,
  RUB: 1.94,
  BYN: 0.069,
  UAH: 0.88,
  KZT: 10.6,
}
