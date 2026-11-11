import { describe, expect, it } from 'vitest'
import {
  checkDealId,
  createDealId,
  dealIdFromMessage,
  dealOpReturn,
  dealPath,
  dealRole,
  dealState,
  feeVariantOf,
  isDealTurn,
  moneyFromPayment,
  moneyFromValue,
  parseDealQuery,
  parseTransfers,
  type DealChain,
  type DealTransfer,
} from './safe-deal'

const OFFER = 'b'.repeat(64)
const BUYER = 'PBuyer111111111111111111111111111'
// A guarantor from the old list (config/roles.ts).
const VALIDATOR = 'PMdhZ1gvZXAXmQ6z5ghHz86arfXorxNYgX'
const SELLER = 'PSeller11111111111111111111111111'
const terms = { offer: OFFER, buyer: BUYER, validator: VALIDATOR, fee: '2' }

describe('deal id', () => {
  it('is built like the old IdHelper', () => {
    // Computed with the old app's MD5 and the same random part.
    expect(createDealId(terms, '0123456789abcdef')).toBe('0123456789abcdef7052858601')
    expect(createDealId({ ...terms, fee: '1.5' }, '0123456789abcdef')).toBe(
      '0123456789abcdefcb36ff6a01'
    )
  })

  it('checks the link it came with', () => {
    const id = createDealId(terms)
    expect(id).toMatch(/^[0-9a-f]{24}01$/)
    expect(checkDealId({ id, ...terms })).toBe(true)
    expect(checkDealId({ id, ...terms, fee: '3' })).toBe(false)
    expect(checkDealId({ id, ...terms, buyer: SELLER })).toBe(false)
    // Version 2 does not exist yet.
    expect(checkDealId({ id: `${id.slice(0, 24)}02`, ...terms })).toBe(false)
  })
})

describe('deal link', () => {
  const id = createDealId(terms, '0123456789abcdef')

  it('keeps the old order of parameters', () => {
    expect(dealPath({ id, ...terms })).toBe(
      `barter/safedeal?id=${id}&offer=${OFFER}&buyer=${BUYER}&validator=${VALIDATOR}&fee=2`
    )
  })

  it('says what is wrong with a link', () => {
    const query = { id, ...terms }
    expect(parseDealQuery(query)).toEqual({ params: { id, ...terms }, problem: null })
    expect(parseDealQuery({ ...query, buyer: '' }).problem).toBe('incomplete')
    expect(parseDealQuery({ ...query, offer: 'xyz' }).problem).toBe('incomplete')
    expect(parseDealQuery({ ...query, validator: SELLER }).problem).toBe('guarantor')
    expect(parseDealQuery({ ...query, fee: '' }).problem).toBe('fee')
    expect(parseDealQuery({ ...query, fee: '3' }).problem).toBe('id')
    // vue-router gives arrays for repeated keys.
    expect(parseDealQuery({ ...query, id: [id, 'x'] }).problem).toBeNull()
  })

  it('writes the same OP_RETURN as the old hexEncode', () => {
    expect(dealOpReturn(id)).toBe(
      '6a2453616665206465616c203031323334353637383961626364656637303532383538363031'
    )
    expect(dealIdFromMessage(`Safe deal ${id}`)).toBe(id)
    expect(dealIdFromMessage('Подарок')).toBeNull()
  })
})

describe('deal money', () => {
  it('splits the fee as the offer says (s7-dealbuyer, s7-dealvalidator)', () => {
    expect(moneyFromValue(1250, 2, 'inHalf')).toMatchObject({
      fee: 25,
      payment: 1262.5,
      toSeller: 1237.5,
    })
    expect(moneyFromValue(1250, 2, 'buyer')).toMatchObject({ payment: 1275, toSeller: 1250 })
    expect(moneyFromValue(1250, 2, 'seller')).toMatchObject({ payment: 1250, toSeller: 1225 })
  })

  it('gets back to the same numbers from what came', () => {
    expect(moneyFromPayment(1262.5, 2, 'inHalf')).toMatchObject({
      value: 1250,
      fee: 25,
      toSeller: 1237.5,
    })
    expect(moneyFromPayment(1275, 2, 'buyer')).toMatchObject({ value: 1250, toSeller: 1250 })
    expect(moneyFromPayment(1250, 2, 'seller')).toMatchObject({ value: 1250, toSeller: 1225 })
  })

  it('reads who pays the fee from the offer', () => {
    expect(feeVariantOf({ safeDeal: { validatorFeeVariant: 'inHalf' } })).toBe('inHalf')
    expect(feeVariantOf({ safeDeal: { validatorFeeVariant: 'seller' } })).toBe('seller')
    expect(feeVariantOf({ safeDeal: {} })).toBe('buyer')
    expect(feeVariantOf(null)).toBe('buyer')
  })
})

describe('deal status', () => {
  const tx = (txid: string, height: number, amount = 1262.5): DealTransfer => ({
    txid,
    from: '',
    to: '',
    amount,
    height,
    time: 0,
  })
  const chain = (c: Partial<DealChain>): DealChain => ({
    paid: [],
    toSeller: [],
    toBuyer: [],
    tip: 1000,
    ...c,
  })

  it('reads node rows once per transaction, amounts in satoshi', () => {
    const row = {
      addrFrom: BUYER,
      addrTo: VALIDATOR,
      hash: 'a'.repeat(64),
      height: 900,
      amount: 126250000000,
      time: 1782929573,
      opreturn: '6a24',
    }
    expect(parseTransfers([row, row, { ...row, hash: 'c'.repeat(64), amount: 0 }])).toEqual([
      {
        txid: 'a'.repeat(64),
        from: BUYER,
        to: VALIDATOR,
        amount: 1262.5,
        height: 900,
        time: 1782929573000,
      },
    ])
    expect(parseTransfers(null)).toEqual([])
  })

  it('moves on with six blocks on top of a transfer', () => {
    expect(dealState(chain({})).status).toBe('1')
    const onItsWay = dealState(chain({ paid: [tx('p', 998)] }))
    expect(onItsWay).toMatchObject({ status: '1', paid: 0 })
    expect(onItsWay.paying?.txid).toBe('p')
    expect(dealState(chain({ paid: [tx('p', 994)] }))).toMatchObject({ status: '2', paid: 1262.5 })
    expect(dealState(chain({ paid: [tx('p', 900)], toSeller: [tx('s', 999)] })).status).toBe('3a')
    expect(dealState(chain({ paid: [tx('p', 900)], toBuyer: [tx('b', 999)] })).status).toBe('3b')
    expect(dealState(chain({ paid: [tx('p', 900)], toSeller: [tx('s', 990)] })).status).toBe('4a')
    expect(dealState(chain({ paid: [tx('p', 900)], toBuyer: [tx('b', 990)] })).status).toBe('4b')
  })

  it('sums the payments that came, and prefers the seller like the old page', () => {
    expect(dealState(chain({ paid: [tx('p1', 900, 1000), tx('p2', 950, 262.5)] })).paid).toBe(
      1262.5
    )
    expect(dealState(chain({ toSeller: [tx('s', 900)], toBuyer: [tx('b', 900)] })).status).toBe(
      '4a'
    )
  })
})

describe('roles', () => {
  const p = { buyer: BUYER, validator: VALIDATOR }

  it('finds mine in the old order', () => {
    expect(dealRole(p, SELLER, BUYER)).toBe('buyer')
    expect(dealRole(p, SELLER, SELLER)).toBe('seller')
    expect(dealRole(p, SELLER, VALIDATOR)).toBe('validator')
    expect(dealRole(p, SELLER, 'PSomeoneElse')).toBeNull()
    expect(dealRole(p, SELLER, null)).toBeNull()
  })

  it('says whose move it is (s7-dealmatrix)', () => {
    expect(isDealTurn('buyer', '1')).toBe(true)
    expect(isDealTurn('validator', '1')).toBe(false)
    expect(isDealTurn('validator', '2')).toBe(true)
    expect(isDealTurn('seller', '2')).toBe(true)
    expect(isDealTurn('buyer', '2')).toBe(false)
    expect(isDealTurn('validator', '3a')).toBe(false)
    expect(isDealTurn('seller', '4a')).toBe(true)
    expect(isDealTurn('buyer', '4b')).toBe(true)
  })
})
