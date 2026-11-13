/**
 * Why a transaction did not go, in words. The previous Bastyon rejects with
 * the node's code (`new Error(-26)`, pocketnet.gui `js/lib/apps/index.js`
 * `appsError`) or its own (`actions_noinputs`, `js/lib/client/actions.js`);
 * bastyon-nextgen sends a sentence ready to show, or a code of its own
 * (`notconfirmed`, `rpc_timeout`, `brtoffer:invalid:price`). Node codes are
 * the old app's `dialogLabels.error#<code>`; anything else is shown as it came.
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

/** The hosts' own codes, by pattern; the first match wins. */
const HOST_CODES: [RegExp, string][] = [
  [/min relay fee/i, 'fee'],
  [/^(not_authenticated|required_authorization)$/, 'signIn'],
  [/^permission/, 'permission'],
  [/^(brtoffer|offer):invalid:/, 'invalid'],
  // bastyon-nextgen's checks of the other records (legacy-objects).
  [/^(brtaccount|comment|upvoteShare|contentDelete):invalid:/, 'badRecord'],
  [/^images:max:10$/, 'imagesMax'],
  [/^sdk_not_ready$/, 'noHost'],
  // No block: within an hour (bastyon-nextgen), the nodes refused it or it
  // waited too long (previous Bastyon).
  [/^(notconfirmed|actions_rejectedFromNodes(_ignore)?|actions_rejectedByTime)$/, 'notConfirmed'],
  // Coins are there but still wait for their block.
  [/^actions_(noinputs|totalAmountSmaller_\w+?)_wait$/, 'coinsWait'],
  [/^actions_(noinputs|totalAmountSmaller|totalAmountZero)/, 'noCoins'],
  [/^actions_waitUserStatus$/, 'registering'],
  [/^(actions_rejectedByUser|cancel|user_cancelled)$/, 'cancelled'],
  [/^actions_collision$/, 'replaced'],
  // The host gave up waiting; the transaction may still go (bastyon-nextgen
  // `APP_TX_TIMEOUT_MS`), so the text asks to check before a retry.
  [/^(rpc_timeout|timeout)$/, 'timeout'],
  [/^rate_limit_exceeded/, 'rateLimit'],
  // bastyon-nextgen writes only for the Barteron in its catalogue (HOST-TASKS, item 8).
  [/^barteron_only$/, 'notAllowed'],
]

/** The cause as a short key, or `null` — show the host's text. */
export function txErrorKey(raw: string | null | undefined): string | null {
  const text = (raw ?? '').trim()
  if (!text || text === 'unknown') return 'unknown'
  const code = text.match(/^(?:code:)?(-?\d+)$/)?.[1]
  if (code !== undefined) return CODES[code] ?? 'unknown'
  return HOST_CODES.find(([pattern]) => pattern.test(text))?.[1] ?? null
}

export function txErrorText(raw: string | null | undefined, t: Translate): string {
  const key = txErrorKey(raw)
  return key ? t(`txError.${key}`) : (raw ?? '').trim()
}
