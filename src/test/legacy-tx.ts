/**
 * How both Bastyon hosts turn what Barteron sends into a transaction:
 * `serialize()` of pocketnet.gui `js/kit.js` (brtOffer, brtAccount), repeated
 * in bastyon-nextgen `src/mini-apps/tx/legacy-objects.ts`. The node checks
 * hash256 of this string against the second OP_RETURN push, so equal strings
 * mean equal transactions. Tests only.
 */

type Data = Record<string, unknown>

export function serializeOffer(address: string, d: Data): string {
  const hash = typeof d.hash === 'string' && d.hash.length === 64 ? d.hash : ''
  return (
    address +
    hash +
    d.language +
    d.caption +
    d.description +
    JSON.stringify({
      t: d.tag,
      a: d.tags,
      c: d.condition,
      p: d.published,
      f: d.currencyPrice,
      d: d.delivery,
      v: d.videoSettings,
      s: d.safeDeal,
      m: d.metaData,
    }) +
    JSON.stringify(d.images) +
    d.geohash +
    d.video +
    d.price
  )
}

export function serializeAccount(address: string, d: Data): string {
  return (
    address +
    JSON.stringify({
      a: d.tags,
      g: d.geohash,
      s: d.static,
      r: d.radius,
      d: d.safeDeal,
      m: d.metaData,
    })
  )
}

/** Double SHA-256, hex: what goes into OP_RETURN. */
export async function hash256(text: string): Promise<string> {
  const once = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  const twice = await crypto.subtle.digest('SHA-256', once)
  return [...new Uint8Array(twice)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
