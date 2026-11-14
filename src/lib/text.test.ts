import { describe, expect, it } from 'vitest'
import { offerFromAlias, parseOffer } from '@/models/offer'
import { parseUserProfile } from '@/models/profile'
import { escapeHtml, visibleName, withoutBidiControls } from './text'

describe('strings from the network', () => {
  it('a name loses what cannot be seen: it does not read backwards or pass for another', () => {
    expect(visibleName('\u202Eanna')).toBe('anna')
    expect(visibleName('an\u200Bna\u200D\uFEFF')).toBe('anna')
    expect(visibleName('an\uFEFFna')).toBe('anna')
    expect(visibleName('\u2067ivan\u2069\u00AD ')).toBe('ivan')
    // Nothing but invisible characters: no name, the address is shown instead.
    expect(visibleName('\u200B\u200E')).toBe('')
    expect(parseUserProfile({ address: 'P1', name: '\u202Eanna\u200B' })?.name).toBe('anna')
  })

  it('a caption keeps emoji and words that need joiners, loses bidi controls', () => {
    const family = '👨\u200D👩\u200D👧'
    expect(withoutBidiControls(`Игрушки ${family}`)).toBe(`Игрушки ${family}`)
    expect(withoutBidiControls('می\u200Cخواهم')).toBe('می\u200Cخواهم')
    expect(withoutBidiControls('Планшет\u202E 06 NIOKP')).toBe('Планшет 06 NIOKP')
    expect(withoutBidiControls('\u2066a\u2069 \u202Ab\u202C')).toBe('a b')
  })

  it('an offer from the chain or from the host on its way has its caption cleaned', () => {
    const tx = {
      hash: 'a'.repeat(64),
      type: 211,
      height: 1,
      time: 1_700_000_000,
      s1: 'P1',
      s2: 'a'.repeat(64),
      p: { s1: 'ru-RU', s2: '\u202EПланшет', s3: 'текст', s4: '{}', s5: '[]', s6: '' },
    }
    expect(parseOffer(tx).caption).toBe('Планшет')
    expect(offerFromAlias({ caption: 'Планшет\u2067', address: 'P1' }, null)?.caption).toBe(
      'Планшет'
    )
  })
})

describe('escapeHtml', () => {
  it('all five characters, quotes too: nothing gets out of the pin text or an attribute', () => {
    expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe(
      '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;'
    )
    expect(escapeHtml('1 250')).toBe('1 250')
  })
})
