import { describe, expect, it } from 'vitest'
import { hash256, serializeOffer } from '@/test/legacy-tx'
import {
  checkOffer,
  emptyOffer,
  exchangeCategories,
  fixedCurrencyPrice,
  isPriceFrom,
  offerFromAlias,
  offerLifecycle,
  offerPkoin,
  parseOffer,
  toOfferPayload,
  toPriceCents,
  OfferInvalidError,
  type Offer,
} from './offer'
import { TX_TYPE, type RawTx } from './tx'

/*
 * A real Barteron offer from mainnet: brtoffer 430ecc22…b541, block 4097xxx.
 * Its fields and the OP_RETURN hash come from bastyon-nextgen
 * `src/mini-apps/tx/legacy-objects.test.ts`, where they were read with
 * getrawtransaction. The node returns it as below (`ConstructTransaction`):
 * the empty video (`p.s7`) is left out.
 */
const AUTHOR = 'PAk3r2YK9ZbrTgxpkwV4tS599xD8pohPMo'
const OP_RETURN = '77f3917f486e8fd6fc9a4813eae60f32b106295028f8e2882336bda159252501'
const ROOT = '430ecc22' + '0'.repeat(52) + 'b541'
const MAINNET_TX: RawTx = {
  hash: ROOT,
  type: TX_TYPE.offer,
  height: 4_097_000,
  time: 1_770_000_000,
  s1: AUTHOR,
  s2: ROOT,
  p: {
    s1: 'ru-RU',
    s2: 'Сеансы биоэнерготерапевта',
    s3: 'Сеансы биоэнерготерапевта.',
    s4: '{"t":277,"a":["my_list"],"c":"new","p":"published","f":{"currency":"RUB","price":"45068.00"},"d":{},"v":{"order":"first"},"s":{},"m":{}}',
    s5: '["https://bastyon.com:8092/i/OUnkKeuoOVnlxRaJCoDudc.jfif"]',
    s6: 'ucfsmxzf7gs3',
    i1: 380000,
  },
}

describe('parseOffer', () => {
  it('reads every field of a mainnet offer', () => {
    const offer = parseOffer(MAINNET_TX)
    expect(offer).toMatchObject({
      hash: ROOT,
      txHash: ROOT,
      address: AUTHOR,
      language: 'ru-RU',
      caption: 'Сеансы биоэнерготерапевта',
      description: 'Сеансы биоэнерготерапевта.',
      tag: 277,
      tags: ['my_list'],
      condition: 'new',
      published: 'published',
      currencyPrice: { currency: 'RUB', price: '45068.00' },
      videoSettings: { order: 'first' },
      images: ['https://bastyon.com:8092/i/OUnkKeuoOVnlxRaJCoDudc.jfif'],
      geohash: 'ucfsmxzf7gs3',
      video: '',
      priceCents: 380000,
      height: 4_097_000,
      time: 1_770_000_000_000,
    })
    // A year after this version.
    expect(new Date(offer.till).getUTCFullYear()).toBe(new Date(offer.time).getUTCFullYear() + 1)
  })

  it('the offer id is the first version; txHash is this version', () => {
    const edit = { ...MAINNET_TX, hash: 'e'.repeat(64) }
    expect(parseOffer(edit)).toMatchObject({ hash: ROOT, txHash: 'e'.repeat(64) })
  })

  it('survives broken JSON and old string ids, like the old model', () => {
    const offer = parseOffer({
      hash: 'a'.repeat(64),
      type: TX_TYPE.offer,
      time: 1_700_000_000,
      p: { s4: '{"t":"1006","a":["58068","my_list","junk"]', s5: 'not json' },
    })
    expect(offer).toMatchObject({ tag: null, tags: [], images: [], condition: 'new' })
    const strings = parseOffer({
      hash: 'a'.repeat(64),
      type: TX_TYPE.offer,
      time: 1_700_000_000,
      p: { s4: '{"t":"1006","a":["58068","my_list","junk"]}' },
    })
    expect(strings.tag).toBe(1006)
    expect(strings.tags).toEqual([58068, 'my_list'])
  })
})

describe('toOfferPayload: what the hosts sign', () => {
  /** The mainnet offer as the old app would have created it. */
  function sameAsMainnet(): Offer {
    const parsed = parseOffer(MAINNET_TX)
    return { ...emptyOffer(AUTHOR, 'ru-RU'), ...parsed, hash: null, txHash: null }
  }

  it('a new offer serialises to exactly the mainnet transaction (hash256 = OP_RETURN)', async () => {
    const payload = toOfferPayload(sameAsMainnet())
    expect(payload.hash).toBeNull()
    expect(payload.price).toBe(380000)
    expect(await hash256(serializeOffer(AUTHOR, { ...payload }))).toBe(OP_RETURN)
  })

  it('read from the node and sent back unchanged, an edit keeps every field', async () => {
    const payload = toOfferPayload(parseOffer(MAINNET_TX))
    expect(payload.hash).toBe(ROOT)
    const serialized = serializeOffer(AUTHOR, { ...payload })
    // Same as the new offer, with the first version's id after the address.
    const asNew = serializeOffer(AUTHOR, { ...payload, hash: null })
    expect(serialized).toBe(AUTHOR + ROOT + asNew.slice(AUTHOR.length))
  })

  it('sends only the fields the hosts read, price in hundredths', () => {
    expect(Object.keys(toOfferPayload(sameAsMainnet())).sort()).toEqual(
      [
        'address',
        'caption',
        'condition',
        'currencyPrice',
        'delivery',
        'description',
        'geohash',
        'hash',
        'images',
        'language',
        'metaData',
        'price',
        'published',
        'safeDeal',
        'tag',
        'tags',
        'video',
        'videoSettings',
      ].sort()
    )
  })

  it('refuses an offer without a category, or with a category that has subcategories', () => {
    const offer = sameAsMainnet()
    expect(() => toOfferPayload({ ...offer, tag: null })).toThrow(OfferInvalidError)
    expect(checkOffer({ ...offer, tag: 0 })).toBe('tag')
    const isLeafCategory = (id: number) => id !== 1001
    expect(checkOffer({ ...offer, tag: 1001 }, { isLeafCategory })).toBe('tag')
    expect(checkOffer({ ...offer, tag: 1006 }, { isLeafCategory })).toBeNull()
  })

  it('refuses empty texts, place and a broken price', () => {
    const offer = sameAsMainnet()
    expect(checkOffer({ ...offer, caption: '  ' })).toBe('caption')
    expect(checkOffer({ ...offer, description: '' })).toBe('description')
    expect(checkOffer({ ...offer, language: '' })).toBe('language')
    expect(checkOffer({ ...offer, geohash: '' })).toBe('geohash')
    expect(checkOffer({ ...offer, priceCents: -1 })).toBe('price')
    expect(checkOffer({ ...offer, priceCents: 1.5 })).toBe('price')
    expect(checkOffer({ ...offer, address: '' })).toBe('address')
  })

  it('PKOIN to hundredths rounds instead of cutting (0.29 → 29)', () => {
    expect(toPriceCents(0.29)).toBe(29)
    expect(toPriceCents(3800)).toBe(380000)
  })
})

describe('offer helpers', () => {
  const now = Date.UTC(2026, 10, 10)
  const offer = { ...emptyOffer(AUTHOR, 'ru-RU', now), hash: 'a'.repeat(64) }

  it('lifecycle: draft, active, withdrawn, removed, expired', () => {
    expect(offerLifecycle({ ...offer, hash: null }, now)).toBe('draft')
    expect(offerLifecycle(offer, now)).toBe('active')
    expect(offerLifecycle({ ...offer, published: 'withdrawed' }, now)).toBe('withdrawn')
    expect(offerLifecycle({ ...offer, published: 'removed' }, now)).toBe('removed')
    expect(offerLifecycle({ ...offer, till: now - 1 }, now)).toBe('expired')
  })

  it('«my list» takes the seller profile list; «for nothing» wants nothing', () => {
    expect(exchangeCategories({ tags: ['my_list'] }, [1, 2])).toEqual([1, 2])
    expect(exchangeCategories({ tags: ['for_nothing', 3] })).toEqual([])
    expect(exchangeCategories({ tags: [3, 4] })).toEqual([3, 4])
  })

  it('a currency price follows the rate; without the rate the PKOIN price is unknown', () => {
    const priced = { priceCents: 380000, currencyPrice: { currency: 'rub', price: '45068.00' } }
    expect(fixedCurrencyPrice(priced)).toEqual({ currency: 'RUB', amount: 45068 })
    expect(offerPkoin(priced, { RUB: 10 })).toBeCloseTo(4506.8)
    expect(offerPkoin(priced, {})).toBeNull()
    expect(offerPkoin({ ...priced, currencyPrice: { isDisabled: true } })).toBe(3800)
  })

  it('«от» for pickup points and when the seller chose it', () => {
    expect(isPriceFrom({ tag: 97, metaData: {} })).toBe(true)
    expect(isPriceFrom({ tag: 1006, metaData: { price: { prefix: 'from' } } })).toBe(true)
    expect(isPriceFrom({ tag: 1006, metaData: {} })).toBe(false)
  })

  it('a pending version is read back from the host’s copy', () => {
    const payload = toOfferPayload(sameAsNew())
    const pending = offerFromAlias(payload, 'f'.repeat(64))
    expect(pending).toMatchObject({
      hash: 'f'.repeat(64),
      caption: payload.caption,
      priceCents: payload.price,
      tags: payload.tags,
    })
    function sameAsNew(): Offer {
      return { ...parseOffer(MAINNET_TX), hash: null }
    }
  })
})
