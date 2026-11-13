/** Barteron in the web version of Bastyon: «Открыть в Bastyon», «Открыть веб-версию». */
export const BASTYON_APP_URL = 'https://bastyon.com/application?id=barteron.pocketnet.app'

/** The host's `hexEncode` (pocketnet.gui `js/lib/apps/sdk.js`): the `p` of an app link. */
export function hexEncode(text: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    let ch = text.charCodeAt(i)
    if (ch > 0xff) ch -= 0x350
    result += ch.toString(16).padStart(2, '0')
  }
  return result
}

/**
 * Barteron in the web version of Bastyon on this page, as `sdk.get.applink`
 * builds it: a link opened in a browser, or a deal in an outdated Bastyon,
 * goes on to the same page, not to the start.
 */
export function bastyonAppLink(path: string): string {
  const page = path.replace(/^\/+/, '')
  return page ? `${BASTYON_APP_URL}&p=${hexEncode(page)}` : BASTYON_APP_URL
}
