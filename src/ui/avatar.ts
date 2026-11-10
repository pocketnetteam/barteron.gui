/**
 * Initials for an avatar without a photo: «Илья Петров» → «ИП», «Мария» → «М».
 * The first letter or digit of each word: «(заглушка)» gives «З», «—» nothing.
 */
export function initials(name: string | null | undefined): string {
  const letters = (name ?? '')
    .trim()
    .split(/\s+/)
    .map((word) => Array.from(word).find((c) => /[\p{L}\p{N}]/u.test(c)) ?? '')
    .filter(Boolean)
  return letters.slice(0, 2).join('').toUpperCase()
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
