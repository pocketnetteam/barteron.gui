/** A point on the map's layer, in pixels. */
export interface Px {
  x: number
  y: number
}

export type PinLayout<T> =
  /** `moved` — laid out apart from its point. */
  { kind: 'one'; item: T; at: Px; moved?: true } | { kind: 'group'; items: T[]; at: Px }

/** Pills joined into «+N» when closer than this many pixels. */
export const PIN_GAP = 46
/** Spread pills: a column of up to this many, then the next column. */
const ROWS = 6
const ROW_H = 36
const COL_W = 120

/**
 * Price pills of the catalog map. Pills closer than `gap` join into «+N»;
 * pressing it zooms in. At the last zoom (`spread`) zooming no longer parts
 * them — offers of one seller often share the very same point — so they are
 * laid out side by side around it, each one pressable, as the old app's
 * cluster did.
 */
export function layoutPins<T>(
  items: readonly { item: T; px: Px }[],
  spread: boolean,
  gap = PIN_GAP
): PinLayout<T>[] {
  const groups: { at: Px; items: T[] }[] = []
  for (const { item, px } of items) {
    const near = groups.find((g) => Math.hypot(g.at.x - px.x, g.at.y - px.y) < gap)
    if (near) near.items.push(item)
    else groups.push({ at: px, items: [item] })
  }
  return groups.flatMap((g): PinLayout<T>[] => {
    if (g.items.length === 1) return [{ kind: 'one', item: g.items[0]!, at: g.at }]
    if (!spread) return [{ kind: 'group', items: g.items, at: g.at }]
    const rows = Math.min(g.items.length, ROWS)
    const cols = Math.ceil(g.items.length / ROWS)
    return g.items.map((item, i) => ({
      kind: 'one',
      item,
      moved: true,
      at: {
        x: g.at.x + (Math.floor(i / ROWS) - (cols - 1) / 2) * COL_W,
        y: g.at.y + ((i % ROWS) - (rows - 1) / 2) * ROW_H,
      },
    }))
  })
}
