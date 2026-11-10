/**
 * Category tree, copied from the old app (barteron.gui `src/data/categories.json`,
 * translations from `src/i18n/<locale>/categories.json`) by a one-off script.
 * Offers keep the category id in `p.s4.t`, so ids must never change.
 *
 * The tree is stored as tuples to halve its size:
 * `[id, parent, order, name, children, icon?, previewName?, removed?]`.
 * Tree and names load lazily, in their own chunks.
 */

import type { Locale } from '@/i18n'

export interface Category {
  id: number
  parent: number | null
  /** Sort order among siblings. */
  order: number
  /** Translation key. */
  name: string
  children: number[]
  /** Font Awesome name in the old app; top-level categories only. */
  icon?: string
  /** Shorter key for tiles: «Одежда» instead of «Одежда для мужчин». */
  previewName?: string
  /** Hidden from pickers; old offers may still point here. */
  removed?: boolean
}

export type CategoryTuple = [
  number,
  number | null,
  number,
  string,
  number[],
  (string | 0)?,
  (string | 0)?,
  1?,
]

export type CategoryNames = Readonly<Record<string, string>>

const byOrder = (a: Category, b: Category) => a.order - b.order

export class CategoryTree {
  private readonly items = new Map<number, Category>()

  constructor(tuples: readonly CategoryTuple[]) {
    for (const [id, parent, order, name, children, icon, previewName, removed] of tuples) {
      this.items.set(id, {
        id,
        parent,
        order,
        name,
        children,
        ...(icon ? { icon } : {}),
        ...(previewName ? { previewName } : {}),
        ...(removed ? { removed: true } : {}),
      })
    }
  }

  get size(): number {
    return this.items.size
  }

  get(id: number | string | null | undefined): Category | undefined {
    if (id === null || id === undefined || id === '') return undefined
    return this.items.get(Number(id))
  }

  /** Top-level categories in display order, without removed ones. */
  roots(): Category[] {
    return [...this.items.values()].filter((c) => c.parent === null && !c.removed).sort(byOrder)
  }

  /** Children in display order, without removed ones. */
  children(id: number): Category[] {
    return (this.get(id)?.children ?? [])
      .map((child) => this.items.get(child))
      .filter((c): c is Category => !!c && !c.removed)
      .sort(byOrder)
  }

  /** Ancestors, top-level first; the category itself is not included. */
  parents(id: number): Category[] {
    const result: Category[] = []
    const seen = new Set<number>()
    let item = this.get(id)
    while (item?.parent != null && !seen.has(item.parent)) {
      seen.add(item.parent)
      const parent = this.items.get(item.parent)
      if (!parent) break
      result.unshift(parent)
      item = parent
    }
    return result
  }

  /**
   * The category and everything below it: a search in a category covers its
   * subcategories (old `findChildrenRecursivelyById`).
   */
  withDescendants(id: number): number[] {
    const result: number[] = []
    const seen = new Set<number>()
    const walk = (current: number) => {
      const item = this.items.get(current)
      if (!item || seen.has(current)) return
      seen.add(current)
      result.push(current)
      item.children.forEach(walk)
    }
    walk(Number(id))
    return result
  }

  hasChildren(id: number): boolean {
    return (this.get(id)?.children.length ?? 0) > 0
  }

  /** A category an offer may be published in: exists, not removed, no subcategories. */
  isLeaf(id: number): boolean {
    const item = this.get(id)
    return !!item && !item.removed && item.children.length === 0
  }

  /** Name for a category id; `null` for an unknown id. */
  label(id: number | null | undefined, names: CategoryNames, preview = false): string | null {
    const item = this.get(id)
    if (!item) return null
    const key = (preview && item.previewName) || item.name
    return names[key] ?? names[item.name] ?? key
  }
}

let treePromise: Promise<CategoryTree> | null = null

export function loadCategoryTree(): Promise<CategoryTree> {
  treePromise ??= import('@/data/categories/tree.json')
    .then((m) => new CategoryTree(m.default as CategoryTuple[]))
    .catch((error) => {
      treePromise = null
      throw error
    })
  return treePromise
}

const NAMES: Record<Locale, () => Promise<{ default: Record<string, string> }>> = {
  ru: () => import('@/data/categories/ru.json'),
  en: () => import('@/data/categories/en.json'),
  sr: () => import('@/data/categories/sr.json'),
}

export async function loadCategoryNames(locale: Locale): Promise<CategoryNames> {
  return (await NAMES[locale]()).default
}
