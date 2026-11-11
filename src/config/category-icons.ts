import type { IconName } from '@/ui/icons'

/** Icons of the top-level categories that have one (s2-home tiles); the rest use `tiles`. */
export const CATEGORY_ICONS: Readonly<Record<number, IconName>> = {
  6000: 'cat-transport',
  10542: 'cat-realty',
  7000: 'cat-electronics',
  11450: 'cat-clothes',
  11700: 'home',
  2984: 'cat-kids',
  2: 'cat-services',
  1000: 'cat-bikes',
  888: 'cat-sport',
  24: 'cat-animals',
  267: 'cat-books',
  1: 'cat-collect',
  13587: 'cat-food',
}

export const categoryIcon = (id: number): IconName => CATEGORY_ICONS[id] ?? 'tiles'
