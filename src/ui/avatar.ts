/** Initials for an avatar without a photo: «Илья Петров» → «ИП», «Мария» → «М». */
export function initials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  const letters = words.slice(0, 2).map((w) => Array.from(w)[0] ?? '')
  return letters.join('').toUpperCase()
}

/** Background / text pairs from the components sheet (violet, amber, green, blue). */
export const AVATAR_COLORS = [
  { bg: '#CEC2FF', fg: '#2A1A73' },
  { bg: '#FFEDBF', fg: '#5C3600' },
  { bg: '#E7F6EE', fg: '#0E5A2F' },
  { bg: '#E8F1FE', fg: '#163F82' },
] as const

/** The same seed (an address) always gets the same colour. */
export function avatarColor(seed: string | null | undefined): (typeof AVATAR_COLORS)[number] {
  let hash = 0
  for (const ch of seed ?? '') hash = (hash * 31 + ch.codePointAt(0)!) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}
