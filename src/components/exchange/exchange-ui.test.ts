import { describe, expect, it } from 'vitest'
import { emptyOffer, type Offer } from '@/models/offer'
import { exchangeItems } from './exchange-ui'

const offer = (n: number, address: string): Offer => ({
  ...emptyOffer(address, 'ru-RU', 0),
  hash: n.toString(16).padStart(64, 'a'),
})

describe('found exchanges as a list', () => {
  it('direct first; two chains to one offer through different people are two rows', () => {
    const source = offer(1, 'PMe')
    const target = offer(2, 'PAnna')
    const items = exchangeItems({
      direct: [offer(3, 'PIlya')],
      chains: [
        { source, via: offer(4, 'PMaria'), target },
        { source, via: offer(5, 'PDima'), target },
      ],
      more: false,
    })
    expect(items.map((i) => i.kind)).toEqual(['direct', 'chain', 'chain'])
    expect(new Set(items.map((i) => i.key)).size).toBe(3)
    expect(items[1]!.to).toMatchObject({
      name: 'ThreeSidedSearch',
      query: { via: offer(4, 'x').hash },
    })
  })
})
