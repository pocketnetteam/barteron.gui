import { describe, expect, it } from 'vitest'
import en from '@/i18n/locales/en'
import ru from '@/i18n/locales/ru'
import sr from '@/i18n/locales/sr'
import { errorText } from '@/stores/tx'
import { txErrorKey, txErrorText } from './tx-errors'

describe('why a transaction did not go', () => {
  it('the previous host rejects with the node code; it stays a number in text', () => {
    expect(errorText(new Error('-26'))).toBe('-26')
    expect(errorText({ code: -26 })).toBe('-26')
    expect(errorText({ error: { code: 28 } })).toBe('28')
    expect(errorText(65)).toBe('65')
  })

  it('codes the old app explained become its words', () => {
    const t = (key: string) => `[${key}]`
    expect(txErrorText('-26', t)).toBe('[txError.fee]')
    expect(txErrorText('min relay fee not met', t)).toBe('[txError.fee]')
    expect(txErrorKey('28')).toBe('tooMany')
    expect(txErrorKey('brtoffer:invalid:geohash')).toBe('invalid')
    expect(txErrorKey('not_authenticated')).toBe('signIn')
    expect(txErrorKey('999')).toBe('unknown')
  })

  it('the hosts’ own codes become words too, not «notconfirmed» on the screen', () => {
    // bastyon-nextgen: no block in an hour; the previous Bastyon: the nodes refused it.
    expect(txErrorKey('notconfirmed')).toBe('notConfirmed')
    expect(txErrorKey('actions_rejectedFromNodes')).toBe('notConfirmed')
    expect(txErrorKey('actions_rejectedByTime')).toBe('notConfirmed')
    // Coins: none, or still waiting for their block (`…_wait`).
    expect(txErrorKey('actions_noinputs')).toBe('noCoins')
    expect(txErrorKey('actions_totalAmountSmaller_amount_fee')).toBe('noCoins')
    expect(txErrorKey('actions_totalAmountZero')).toBe('noCoins')
    expect(txErrorKey('actions_noinputs_wait')).toBe('coinsWait')
    expect(txErrorKey('actions_totalAmountSmaller_amount_fee_wait')).toBe('coinsWait')
    expect(txErrorKey('actions_waitUserStatus')).toBe('registering')
    expect(txErrorKey('actions_rejectedByUser')).toBe('cancelled')
    expect(txErrorKey('cancel')).toBe('cancelled')
    expect(txErrorKey('actions_collision')).toBe('replaced')
    // bastyon-nextgen: two minutes without an answer — the transaction may still go.
    expect(txErrorKey('rpc_timeout')).toBe('timeout')
    expect(errorText({ message: 'rpc_timeout', name: 'TimeoutError', code: 'timeout' })).toBe(
      'rpc_timeout'
    )
    expect(txErrorKey('rate_limit_exceeded: retry after 4000ms')).toBe('rateLimit')
    expect(txErrorKey('barteron_only')).toBe('notAllowed')
    // Its checks of the record (legacy-objects): an offer, and the rest.
    expect(txErrorKey('brtoffer:invalid:price')).toBe('invalid')
    expect(txErrorKey('comment:invalid:content')).toBe('badRecord')
    expect(txErrorKey('upvoteShare:invalid:value')).toBe('badRecord')
    expect(txErrorKey('contentDelete:invalid:hash')).toBe('badRecord')
    expect(txErrorKey('brtaccount:invalid:address')).toBe('badRecord')
  })

  it('every key has a text in all three languages', () => {
    const keys = Object.keys(ru.txError)
    for (const raw of [
      '-26',
      '4',
      '5',
      '12',
      '21',
      '28',
      '51',
      '60',
      '65',
      '',
      'not_authenticated',
      'permission:payment',
      'brtoffer:invalid:x',
      'images:max:10',
      'sdk_not_ready',
      'notconfirmed',
      'actions_noinputs',
      'actions_noinputs_wait',
      'actions_waitUserStatus',
      'cancel',
      'actions_collision',
      'rpc_timeout',
      'rate_limit_exceeded',
      'barteron_only',
      'comment:invalid:x',
    ]) {
      const key = txErrorKey(raw)!
      expect(keys, raw).toContain(key)
      expect(Object.keys(en.txError)).toContain(key)
      expect(Object.keys(sr.txError)).toContain(key)
    }
  })

  it('bastyon-nextgen already sends a sentence: shown as it is', () => {
    const t = (key: string) => `[${key}]`
    expect(txErrorText('Недостаточно монет для комиссии', t)).toBe(
      'Недостаточно монет для комиссии'
    )
  })
})
