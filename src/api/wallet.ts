/**
 * PKOIN balance from `get.balance()`. The hosts answer differently:
 * - the previous Bastyon (pocketnet.gui `account.actualBalance`): `{ actual, … }`;
 * - bastyon-nextgen (`actions/wallet.ts`): `{ available, frozen }`.
 * The old app read `actual`.
 */
export function parseBalance(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  for (const key of ['actual', 'available', 'total']) {
    const n = Number(v[key])
    if (v[key] !== undefined && v[key] !== null && Number.isFinite(n)) return n
  }
  return null
}
