import { describe, expect, it } from 'vitest'
import { CategoryTree, loadCategoryNames, loadCategoryTree } from './categories'

describe('categories from the old app', () => {
  it('all 2415 categories with names in ru, en and sr', async () => {
    const tree = await loadCategoryTree()
    expect(tree.size).toBe(2415)
    const [ru, en, sr] = await Promise.all([
      loadCategoryNames('ru'),
      loadCategoryNames('en'),
      loadCategoryNames('sr'),
    ])
    expect(tree.label(1006, ru)).toBe('Горные')
    expect(tree.label(1000, ru)).toBe('Велосипеды, самокаты, гироскутеры')
    expect(tree.label(1000, en)).toMatch(/bicycle/i)
    expect(tree.label(13589, sr)).toBe('Чај')
    expect(tree.label(424242, ru)).toBeNull()
  })

  it('walks the tree: roots, parents, everything below', async () => {
    const tree = await loadCategoryTree()
    expect(tree.roots()).toHaveLength(37)
    expect(tree.parents(1006).map((c) => c.id)).toEqual([1000, 1001])
    expect(tree.withDescendants(1001)).toEqual([1001, 1002, 1003, 1004, 1005, 1006, 1007])
    expect(tree.children(1001).map((c) => c.id)).toContain(1006)
  })

  it('offers go only to leaves that are not removed', async () => {
    const tree = await loadCategoryTree()
    expect(tree.isLeaf(1006)).toBe(true)
    expect(tree.isLeaf(1001)).toBe(false)
    // Removed in the old app; old offers may still point here.
    expect(tree.get(11629)?.removed).toBe(true)
    expect(tree.isLeaf(11629)).toBe(false)
    expect(tree.isLeaf(97)).toBe(true)
  })

  it('tiles use the shorter preview name', async () => {
    const tree = await loadCategoryTree()
    const ru = await loadCategoryNames('ru')
    const clothing = tree.get(11452)!
    expect(clothing.previewName).toBe('clothing_for_men')
    expect(tree.label(11452, ru, true)).toBe(ru.clothing_for_men)
    expect(tree.label(11452, ru)).toBe(ru.clothing)
  })

  it('a loop in the data does not hang', () => {
    const tree = new CategoryTree([
      [1, 2, 0, 'a', [2]],
      [2, 1, 0, 'b', [1]],
    ])
    expect(tree.parents(1).map((c) => c.id)).toEqual([1, 2])
    expect(tree.withDescendants(1)).toEqual([1, 2])
  })
})
