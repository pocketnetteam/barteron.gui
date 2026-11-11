/**
 * «Полезные советы» (s8-help-desktop): the old useful-tips dialog
 * (`usefulTipsLabels.section_N_chapter_M_item_K_text`), shortened, as a page.
 * The structure is here; the texts are in i18n under `tips.<section>.<chapter>`:
 * `title` and `i1`…`iN`.
 */

/** Where a chapter's link leads; the page turns it into a route or a window. */
export type TipLink =
  | 'createExchange'
  | 'createPlace'
  | 'safeDealHelp'
  | 'notifications'
  | 'location'
  | 'map'
  | 'barters'

export interface TipChapter {
  key: string
  items: number
  link?: TipLink
}

export interface TipSection {
  key: 'create' | 'notify' | 'search' | 'barter'
  chapters: TipChapter[]
}

export const TIPS: readonly TipSection[] = [
  {
    key: 'create',
    chapters: [
      { key: 'name', items: 3 },
      { key: 'category', items: 3 },
      { key: 'photos', items: 2 },
      { key: 'video', items: 2 },
      { key: 'exchange', items: 2, link: 'createExchange' },
      { key: 'description', items: 3 },
      { key: 'delivery', items: 1, link: 'createPlace' },
      { key: 'safe', items: 3, link: 'safeDealHelp' },
    ],
  },
  { key: 'notify', chapters: [{ key: 'setup', items: 4, link: 'notifications' }] },
  {
    key: 'search',
    chapters: [
      { key: 'place', items: 2, link: 'location' },
      { key: 'exchange', items: 3 },
      { key: 'filters', items: 2 },
      { key: 'count', items: 3, link: 'map' },
    ],
  },
  {
    key: 'barter',
    chapters: [
      { key: 'kinds', items: 4 },
      { key: 'direct', items: 3, link: 'barters' },
      { key: 'manual', items: 4 },
      { key: 'chain', items: 4 },
      { key: 'group', items: 3 },
    ],
  },
]

export const tipItemKeys = (section: string, chapter: TipChapter): string[] =>
  Array.from({ length: chapter.items }, (_, i) => `tips.${section}.${chapter.key}.i${i + 1}`)

/**
 * Chapters whose title or advice has every word of the query, by section.
 * `text` turns a key into the shown text.
 */
export function searchTips(
  query: string,
  text: (key: string) => string,
  locale: string
): { section: TipSection; chapters: TipChapter[] }[] {
  const words = query.toLocaleLowerCase(locale).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return TIPS.flatMap((section) => {
    const chapters = section.chapters.filter((chapter) => {
      const all = [`tips.${section.key}.${chapter.key}.title`, ...tipItemKeys(section.key, chapter)]
        .map((key) => text(key))
        .join(' ')
        .toLocaleLowerCase(locale)
      return words.every((w) => all.includes(w))
    })
    return chapters.length ? [{ section, chapters }] : []
  })
}
