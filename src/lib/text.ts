/**
 * Strings from the network that others will read next to our own text.
 *
 * Bidi embeddings, overrides and isolates (U+202A–202E, U+2066–2069) change
 * how the text after them reads without being seen: a caption with U+202E
 * turns «· 60 PKOIN» on the same line around, a name with it reads backwards.
 * Bastyon clients take only Latin letters, digits and «_» in names, but the
 * chain does not check that, so a name may also hide zero-width characters
 * and pass for someone else's.
 */

const BIDI_CONTROLS = /[\u202A-\u202E\u2066-\u2069]/g

/** Also invisible in a name: zero-width spaces and joiners, marks, word joiners, BOM, soft hyphen. */
const INVISIBLE = /[\u00AD\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g

/**
 * A caption without bidi controls. Zero-width joiners stay: emoji sequences
 * and Persian words need them.
 */
export const withoutBidiControls = (text: string): string => text.replace(BIDI_CONTROLS, '')

/** A person's name as it is seen: nothing invisible, no spaces around. */
export const visibleName = (name: string): string => name.replace(INVISIBLE, '').trim()

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Text put into HTML by hand (Leaflet `divIcon`): all five characters, quotes too. */
export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c)
