/**
 * Why a transaction did not go, in words. The previous Bastyon rejects with
 * the node's code (`new Error(-26)`, pocketnet.gui `js/lib/apps/index.js`
 * `appsError`); bastyon-nextgen sends a sentence ready to show. Codes are the
 * old app's `dialogLabels.error#<code>`; anything else is shown as it came.
 */

type Translate = (key: string, params?: Record<string, unknown>) => string

/** Node codes the old app explained (localization.json `error#…`). */
const CODES: Record<string, string> = {
  '-26': 'fee',
  '4': 'scoredBefore',
  '5': 'ownScore',
  '12': 'notFound',
  '21': 'opReturn',
  '28': 'tooMany',
  '51': 'deleted',
  '60': 'lowScoreRep',
  '65': 'limit',
}

/** The cause as a short key, or `null` — show the host's text. */
export function txErrorKey(raw: string | null | undefined): string | null {
  const text = (raw ?? '').trim()
  if (!text || text === 'unknown') return 'unknown'
  const code = text.match(/^(?:code:)?(-?\d+)$/)?.[1]
  if (code !== undefined) return CODES[code] ?? 'unknown'
  if (/min relay fee/i.test(text)) return 'fee'
  if (/^(not_authenticated|required_authorization)$/.test(text)) return 'signIn'
  if (/^permission/.test(text)) return 'permission'
  if (/^(brtoffer|offer):invalid:/.test(text)) return 'invalid'
  if (text === 'images:max:10') return 'imagesMax'
  if (text === 'sdk_not_ready') return 'noHost'
  return null
}

export function txErrorText(raw: string | null | undefined, t: Translate): string {
  const key = txErrorKey(raw)
  return key ? t(`txError.${key}`) : (raw ?? '').trim()
}
