import { describe, expect, it } from 'vitest'
import en from '@/i18n/locales/en'
import ru from '@/i18n/locales/ru'
import sr from '@/i18n/locales/sr'
import { searchTips, tipItemKeys, TIPS } from './tips'

const at = (messages: unknown, key: string): unknown =>
  key
    .split('.')
    .reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], messages)

describe('useful tips', () => {
  it('has every title and every piece of advice in all three languages', () => {
    for (const messages of [ru, en, sr]) {
      for (const section of TIPS) {
        for (const key of ['title', 'short', 'meta']) {
          expect(at(messages, `tips.${section.key}.${key}`)).toEqual(expect.any(String))
        }
        for (const chapter of section.chapters) {
          expect(at(messages, `tips.${section.key}.${chapter.key}.title`)).toEqual(
            expect.any(String)
          )
          for (const key of tipItemKeys(section.key, chapter)) {
            expect(at(messages, key), key).toEqual(expect.any(String))
          }
          // No advice beyond the count: the count is the structure.
          expect(
            at(messages, `tips.${section.key}.${chapter.key}.i${chapter.items + 1}`)
          ).toBeUndefined()
          if (chapter.link)
            expect(at(messages, `tips.link.${chapter.link}`)).toEqual(expect.any(String))
        }
      }
    }
  })

  it('finds chapters by every word of the query, in titles and advice', () => {
    const text = (key: string) => String(at(ru, key))
    const found = searchTips('видео 720p', text, 'ru')
    expect(found.map((g) => g.section.key)).toEqual(['create'])
    expect(found[0]!.chapters.map((c) => c.key)).toEqual(['video'])

    expect(searchTips('уведомления', text, 'ru').map((g) => g.section.key)).toContain('notify')
    expect(searchTips('  ', text, 'ru')).toEqual([])
    expect(searchTips('жираф', text, 'ru')).toEqual([])
  })
})
