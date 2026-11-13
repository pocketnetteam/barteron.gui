import { describe, expect, it } from 'vitest'
import { md5 } from '@/lib/md5'
import mainnet from '@/test/mainnet-deals.json'
import oldIds from '@/test/old-deal-ids.json'
import {
  checkDealId,
  createDealId,
  dealConflict,
  dealIdFromMessage,
  dealOpReturn,
  dealPath,
  dealRole,
  dealState,
  dealStep,
  feeVariantOf,
  isDealFinished,
  isDealTurn,
  MIN_CONFIRMATIONS,
  moneyFromPayment,
  moneyFromValue,
  opReturnHex,
  parseDealQuery,
  parseTransfers,
  PAYMENT_WAIT_MS,
  paysNow,
  roundPkoin,
  SAFE_DEAL_API_VERSION,
  SAFE_DEAL_START_HEIGHT,
  type DealChain,
  type DealTransfer,
  type FeeVariant,
} from './safe-deal'

const OFFER = 'b'.repeat(64)
const BUYER = 'PBuyer111111111111111111111111111'
// A guarantor from the old list (config/roles.ts).
const VALIDATOR = 'PMdhZ1gvZXAXmQ6z5ghHz86arfXorxNYgX'
const SELLER = 'PSeller11111111111111111111111111'
const terms = { offer: OFFER, buyer: BUYER, validator: VALIDATOR, fee: '2' }

describe('deal id, as the old IdHelper made it (barteron.gui run in Node, 13.11.2026)', () => {
  it.each(oldIds.ids.map((row) => [row.note, row] as const))('%s', (_, row) => {
    const { random, id, note: _note, ...dealTerms } = row
    expect(createDealId(dealTerms, random)).toBe(id)
    expect(checkDealId({ id, ...dealTerms })).toBe(true)
  })

  it('any field changed, the id no longer fits', () => {
    const row = oldIds.ids[0]!
    const link = {
      id: row.id,
      offer: row.offer,
      buyer: row.buyer,
      validator: row.validator,
      fee: row.fee,
    }
    expect(checkDealId(link)).toBe(true)
    for (const key of ['offer', 'buyer', 'validator', 'fee'] as const) {
      expect(checkDealId({ ...link, [key]: `${link[key]}1` })).toBe(false)
    }
    expect(checkDealId({ ...link, buyer: link.validator, validator: link.buyer })).toBe(false)
    expect(checkDealId({ ...link, id: `${row.id.slice(0, 15)}0${row.id.slice(16)}` })).toBe(false)
  })

  it('ids the old app never made do not open', () => {
    const row = oldIds.ids[0]!
    const link = { offer: row.offer, buyer: row.buyer, validator: row.validator, fee: row.fee }
    for (const id of [
      row.id.toUpperCase(),
      `${row.id.slice(0, 24)}x01`,
      `${row.id.slice(0, 24)}00`,
      `${row.id.slice(0, 24)}ff`,
      row.id.slice(0, 20),
      '',
    ]) {
      expect(checkDealId({ id, ...link })).toBe(false)
    }
  })
})

describe('mainnet deals of the old app (December 2025)', () => {
  it.each(mainnet.deals.map((d) => [d.id, d] as const))('%s', (_, d) => {
    const link = { id: d.id, offer: d.offer, buyer: d.buyer, validator: d.validator, fee: d.fee }
    expect(parseDealQuery(link)).toEqual({ params: link, problem: null })
    expect(
      parseDealQuery(Object.fromEntries(new URLSearchParams(dealPath(link).split('?')[1])))
    ).toEqual({
      params: link,
      problem: null,
    })
    // The script we ask the node for is the one the old page wrote.
    const script = dealOpReturn(d.id)
    expect(script).toBe(d.paid[0]!.opreturn)
    const paid = parseTransfers(d.paid, { from: d.buyer, to: d.validator, opReturn: script })
    const toSeller = parseTransfers(d.toSeller, {
      from: d.validator,
      to: d.seller,
      opReturn: script,
    })
    const state = dealState({ paid, toSeller, toBuyer: [], tip: mainnet.tip })
    expect(state).toMatchObject({ status: '4a', paid: d.paid[0]!.amount / 1e8 })
    // The guarantor sent the seller what the new page would have told them to.
    expect(moneyFromPayment(state.paid, Number(d.fee), 'buyer').toSeller).toBe(toSeller[0]!.amount)
  })
})

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
    // Not even one built the version 1 way with «2» in it: the old helper threw.
    const random = id.slice(0, 16)
    const source = `${random}${OFFER}${BUYER}${VALIDATOR}${terms.fee}2`
    expect(checkDealId({ id: `${random}${md5(source).slice(0, 8)}02`, ...terms })).toBe(false)
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
    expect(parseDealQuery({ ...query, buyer: null }).problem).toBe('incomplete')
    expect(parseDealQuery({ ...query, buyer: ` ${BUYER}\n` }).problem).toBeNull()
    expect(parseDealQuery({ ...query, offer: 'xyz' }).problem).toBe('incomplete')
    expect(parseDealQuery({ ...query, validator: SELLER }).problem).toBe('guarantor')
    // The buyer guarantees his own deal: whatever the id says.
    const self = { ...terms, buyer: VALIDATOR }
    expect(parseDealQuery({ ...self, id: createDealId(self) }).problem).toBe('participants')
    expect(parseDealQuery({ ...query, fee: '' }).problem).toBe('fee')
    expect(parseDealQuery({ ...query, fee: '3' }).problem).toBe('id')
    // No fee, with an id that fits: the old page let «0» or «abc» through
    // and counted a zero or NaN fee.
    // Nor one a guarantor could not set: 0 < fee < 99, written as a number.
    for (const fee of ['0', '-5', 'abc', '99', '500', '0x10', '1e1', ' ']) {
      const link = { ...terms, fee, id: createDealId({ ...terms, fee }, '0123456789abcdef') }
      expect(parseDealQuery(link).problem).toBe('fee')
    }
    for (const fee of ['98.5', '0.5', '05']) {
      const link = { ...terms, fee, id: createDealId({ ...terms, fee }, '0123456789abcdef') }
      expect(parseDealQuery(link).problem).toBeNull()
    }
    // vue-router gives arrays for repeated keys.
    expect(parseDealQuery({ ...query, id: [id, 'x'] }).problem).toBeNull()
  })

  it('writes the same OP_RETURN as the old hexEncode', () => {
    expect(dealOpReturn(id)).toBe(
      '6a2453616665206465616c203031323334353637383961626364656637303532383538363031'
    )
    expect(dealIdFromMessage(`Safe deal ${id}`)).toBe(id)
    expect(dealIdFromMessage('Подарок')).toBeNull()
    expect(dealIdFromMessage(`Safe deal ${id.toUpperCase()}`)).toBeNull()
    expect(dealIdFromMessage(`Safe deal ${id} `)).toBeNull()
    expect(dealIdFromMessage(42)).toBeNull()
  })

  it('one push of OP_RETURN holds 75 bytes, counted in UTF-8', () => {
    expect(opReturnHex('x'.repeat(75))).toMatch(/^6a4b(78){75}$/)
    expect(() => opReturnHex('x'.repeat(76))).toThrow('too long')
    expect(opReturnHex('ж')).toBe('6a02d0b6')
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

  it('what came is shown to the satoshi, not rounded', () => {
    expect(moneyFromPayment(1.23456789, 5, 'buyer')).toMatchObject({
      payment: 1.23456789,
      value: 1.18,
      toSeller: 1.18,
    })
  })

  it('half a hundredth goes up, without binary noise', () => {
    expect(roundPkoin(0.1 + 0.2)).toBe(0.3)
    expect(roundPkoin(1.005)).toBe(1.01)
    expect(roundPkoin(1262.5)).toBe(1262.5)
    expect(roundPkoin(0.004999)).toBe(0)
    // 35 × 1.005 is 35.174999… in binary; the old toFixed(2) gave 35.17.
    expect(moneyFromValue(35, 0.5, 'buyer').payment).toBe(35.18)
    expect(moneyFromValue(1, 0.5, 'buyer').payment).toBe(1.01)
    expect(moneyFromPayment(5, 0.5, 'seller').toSeller).toBe(4.98)
  })

  it('exact to the hundredth, whoever pays the fee', () => {
    // Exact in integers: hundredths of PKOIN, tenths of a percent, halves up.
    const halfUp = (num: bigint, den: bigint) => Number((2n * num + den) / (2n * den)) / 100
    const share = { buyer: 2, inHalf: 1, seller: 0 }
    let checked = 0
    const wrong: string[] = []
    for (const fee of [0.5, 1, 1.5, 2, 2.5, 5, 7.5, 10, 98]) {
      const f = BigInt(fee * 10)
      for (const variant of ['buyer', 'inHalf', 'seller'] as FeeVariant[]) {
        const s = BigInt(share[variant])
        for (let cents = 1n; cents <= 3000n; cents++) {
          checked++
          const payment = moneyFromValue(Number(cents) / 100, fee, variant).payment
          if (payment !== halfUp(cents * (2000n + s * f), 2000n)) {
            wrong.push(`pay ${cents} ${fee} ${variant}`)
          }
          const paidCents = BigInt(Math.round(payment * 100))
          const toSeller = moneyFromPayment(payment, fee, variant).toSeller
          if (toSeller !== halfUp(paidCents * (2000n + s * f - 2n * f), 2000n + s * f)) {
            wrong.push(`seller ${paidCents} ${fee} ${variant}`)
          }
        }
      }
    }
    expect(wrong.slice(0, 5)).toEqual([])
    expect(checked).toBe(81_000)
  })

  it('when the buyer pays the fee, the seller gets what the old page sent', () => {
    for (const fee of [1, 2, 2.5, 5, 10]) {
      for (let cents = 1; cents <= 5000; cents += 7) {
        const paid = cents / 100
        expect(moneyFromPayment(paid, fee, 'buyer').toSeller).toBe(
          Number((paid / (1 + fee / 100)).toFixed(2))
        )
      }
    }
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

  const id = createDealId(terms, '0123456789abcdef')
  const script = dealOpReturn(id)
  const query = { from: BUYER, to: VALIDATOR, opReturn: script }
  const row = {
    addrFrom: BUYER,
    addrTo: VALIDATOR,
    hash: 'a'.repeat(64),
    type: 1,
    height: 900,
    amount: 126250000000,
    time: 1782929573,
    opreturn: script,
  }

  it('reads node rows once per transaction, amounts in satoshi', () => {
    expect(parseTransfers([row, row, { ...row, hash: 'c'.repeat(64), amount: 0 }], query)).toEqual([
      {
        txid: 'a'.repeat(64),
        from: BUYER,
        to: VALIDATOR,
        amount: 1262.5,
        height: 900,
        time: 1782929573000,
      },
    ])
    expect(parseTransfers(null, query)).toEqual([])
    expect(parseTransfers([null, 'x', { ...row, hash: 7 }], query)).toEqual([])
    expect(parseTransfers([{ ...row, time: undefined }], query)[0]!.time).toBe(0)
  })

  it('counts only what was asked: this sender, this receiver, this deal', () => {
    const other = (patch: object, n: string) => ({ ...row, ...patch, hash: n.repeat(64) })
    const rows = [
      row,
      // Someone else paid the guarantor with the same message.
      other({ addrFrom: SELLER }, 'b'),
      // The node takes an empty address for anyone: a refund is not a payment.
      other({ addrFrom: VALIDATOR, addrTo: BUYER }, 'c'),
      // A host that loses the script gets the node's default label.
      other({ opreturn: '6a0e613a737562736372697074696f6e' }, 'd'),
      other({ opreturn: dealOpReturn(createDealId(terms, 'fedcba9876543210')) }, 'e'),
      other({ opreturn: undefined }, 'f'),
      // Not in a block: no height to count confirmations from.
      other({ height: undefined }, '1'),
      other({ height: 0 }, '2'),
      // The same script in capitals is still it.
      other({ opreturn: script.toUpperCase() }, '3'),
    ]
    expect(parseTransfers(rows, query).map((t) => t.txid[0])).toEqual(['a', '3'])
  })

  it('a partial payment, a second one, too much: the guarantor sees what came', () => {
    const at = (txid: string, height: number, amount: number) => tx(txid, height, amount)
    expect(dealState(chain({ paid: [at('p1', 900, 1000)] }))).toMatchObject({
      status: '2',
      paid: 1000,
    })
    // The second payment waits for its blocks; only the first counts so far,
    // and the guarantor is told one more is coming.
    expect(dealState(chain({ paid: [at('p1', 900, 1000), at('p2', 998, 262.5)] }))).toMatchObject({
      status: '2',
      paid: 1000,
      paying: { txid: 'p2', amount: 262.5 },
    })
    expect(dealState(chain({ paid: [at('p1', 900, 1000)] })).paying).toBeNull()
    expect(dealState(chain({ paid: [at('p1', 900, 0.1), at('p2', 901, 0.2)] })).paid).toBe(0.3)
    expect(dealState(chain({ paid: [at('p1', 900, 1300)] })).paid).toBe(1300)
  })

  it('a refund ends the deal; six blocks on top, not five', () => {
    const paid = [tx('p', 900)]
    expect(dealState(chain({ paid, toBuyer: [tx('b', 994)] }))).toMatchObject({
      status: '4b',
      transfer: { txid: 'b' },
    })
    expect(dealState(chain({ paid, toBuyer: [tx('b', 995)] })).status).toBe('3b')
    expect(dealState(chain({ paid, toSeller: [tx('s', 994)] })).status).toBe('4a')
    expect(dealState(chain({ paid, toSeller: [tx('s', 995)] })).status).toBe('3a')
    // A node a few blocks behind the transfer: not confirmed.
    expect(dealState(chain({ paid, toSeller: [tx('s', 1003)] })).status).toBe('3a')
    // Two payouts: the latest is the one shown.
    const two = dealState(chain({ paid, toSeller: [tx('s1', 950), tx('s2', 960), tx('s0', 940)] }))
    expect(two.transfer?.txid).toBe('s2')
  })

  it('the old page’s numbers', () => {
    // content/index.js: minDepthForSafeDealFeature, minConfirmationsForPayment,
    // waitingIntervalMs; sdk.js safeDealAvailable.
    expect(SAFE_DEAL_START_HEIGHT).toBe(3_466_240)
    expect(MIN_CONFIRMATIONS).toBe(6)
    expect(PAYMENT_WAIT_MS).toBe(20 * 60 * 1000)
    expect(SAFE_DEAL_API_VERSION).toBe(7)
    // Both mainnet deals are later than the start height.
    for (const d of mainnet.deals) expect(d.paid[0]!.height).toBeGreaterThan(SAFE_DEAL_START_HEIGHT)
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
    // One address in two parts: the first that fits, as the old switch did.
    expect(dealRole({ buyer: VALIDATOR, validator: VALIDATOR }, SELLER, VALIDATOR)).toBe('buyer')
    expect(dealRole({ buyer: BUYER, validator: SELLER }, SELLER, SELLER)).toBe('seller')
    expect(dealRole(p, null, SELLER)).toBeNull()
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

  it('one person in two parts: the deal guarantees nothing', () => {
    expect(dealConflict(p, SELLER)).toBe(false)
    expect(dealConflict(p, null)).toBe(false)
    expect(dealConflict(p, BUYER)).toBe(true)
    expect(dealConflict(p, VALIDATOR)).toBe(true)
    expect(dealConflict({ buyer: VALIDATOR, validator: VALIDATOR }, null)).toBe(true)
  })

  it('who sends money now, and the step of four', () => {
    expect(paysNow('buyer', '1')).toBe(true)
    expect(paysNow('validator', '2')).toBe(true)
    for (const [role, status] of [
      ['buyer', '2'],
      ['validator', '1'],
      ['seller', '1'],
      ['seller', '2'],
      ['validator', '3a'],
      [null, '1'],
    ] as const) {
      expect(paysNow(role, status)).toBe(false)
    }
    expect((['1', '2', '3a', '3b', '4a', '4b'] as const).map(dealStep)).toEqual([1, 2, 3, 3, 4, 4])
    expect((['3a', '4a', '4b'] as const).map(isDealFinished)).toEqual([false, true, true])
  })
})
