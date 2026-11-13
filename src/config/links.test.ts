import { describe, expect, it } from 'vitest'
import { BASTYON_APP_URL, bastyonAppLink, hexEncode } from './links'

describe('a link to Barteron in Bastyon', () => {
  it('encodes the page as the host’s sdk.js does (vectors from its `hexEncode`)', () => {
    expect(hexEncode('barter/abc')).toBe('6261727465722f616263')
    expect(hexEncode('profile/PMdhZ1gvZXAXmQ6z5ghHz86arfXorxNYgX#votes')).toBe(
      '70726f66696c652f504d64685a3167765a5841586d51367a356768487a3836617266586f72784e59675823766f746573'
    )
    // Above 0xff the host subtracts 0x350: Cyrillic fits in one byte.
    expect(hexEncode('category/1006?search=велосипед')).toBe(
      '63617465676f72792f313030363f7365617263683de2e5ebeef1e8efe5e4'
    )
    // Always two digits, also below 0x10 (and below 0x360 after the shift).
    expect(hexEncode('a\tb\n')).toBe('6109620a')
    expect(hexEncode('͕')).toBe('05')
  })

  it('keeps the page: a deal opened in an outdated Bastyon goes on to the same deal', () => {
    expect(bastyonAppLink('/barter/abc')).toBe(`${BASTYON_APP_URL}&p=6261727465722f616263`)
    expect(
      bastyonAppLink(
        '/barter/safedeal?id=0123456789abcdef7052858601&offer=47693af0&buyer=PMdh&validator=PPbN&fee=5'
      )
    ).toBe(
      `${BASTYON_APP_URL}&p=6261727465722f736166656465616c3f69643d3031323334353637383961626364656637303532383538363031266f666665723d34373639336166302662757965723d504d64682676616c696461746f723d5050624e266665653d35`
    )
    expect(bastyonAppLink('/')).toBe(BASTYON_APP_URL)
    expect(bastyonAppLink('')).toBe(BASTYON_APP_URL)
  })
})
