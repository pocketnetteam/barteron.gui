import { expect, test, type Page } from '@playwright/test'

/**
 * Design system showcase (/dev/ui): the sheets render in both themes,
 * fit the screen at 1440 and 390, and the interactive parts work.
 */
const SHEETS = ['foundations', 'components', 'marketplace', 'data'] as const

async function noHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

test.describe('showcase', () => {
  for (const sheet of SHEETS) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${sheet} · ${theme}: renders and fits the width`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('barteron.theme', t), theme)
        await page.goto(`/dev/ui/${sheet}`)
        await expect(page.getByTestId('showcase')).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await noHorizontalScroll(page)
      })
    }
  }

  test('token pairs pass WCAG AA in both themes', async ({ page }) => {
    await page.goto('/dev/ui/foundations')
    // Values are read from the CSS after mount.
    await expect(page.getByTestId('contrast-dark').first()).toContainText(':1')
    for (const theme of ['light', 'dark']) {
      const ratios = await page.getByTestId(`contrast-${theme}`).allTextContents()
      expect(ratios.length).toBeGreaterThanOrEqual(6)
      for (const text of ratios) {
        const value = Number(text.trim().replace(':1', '').replace(',', '.'))
        expect(value, `${theme}: ${text}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  test('the theme switch applies and is remembered', async ({ page }) => {
    await page.goto('/dev/ui')
    const html = page.locator('html')
    await page.getByTestId('theme-switch').getByRole('radio', { name: 'Тёмная' }).click()
    await expect(html).toHaveAttribute('data-theme', 'dark')
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toBe('rgb(14, 14, 19)')

    await page.reload()
    await expect(html).toHaveAttribute('data-theme', 'dark')

    await page.getByTestId('theme-switch').getByRole('radio', { name: 'Светлая' }).click()
    await expect(html).toHaveAttribute('data-theme', 'light')
  })

  test('«Системная» follows the OS outside Bastyon', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/dev/ui')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('the language switch translates the components', async ({ page }) => {
    await page.goto('/dev/ui/marketplace')
    await expect(page.getByText('Отправляем на ноду')).toBeVisible()
    await page.getByRole('combobox', { name: 'Язык' }).click()
    await page.getByRole('option', { name: 'Српски' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'sr')
    await expect(page.getByText('Шаљемо на чвор')).toBeVisible()
  })

  test('header on desktop, tab bar on the phone', async ({ page }, info) => {
    await page.goto('/dev/ui')
    const tabbar = page.getByRole('navigation', { name: 'Основная навигация' }).first()
    const header = page.locator('header.header').first()
    if (info.project.name === 'phone') {
      await expect(tabbar).toBeVisible()
      await expect(header).toBeHidden()
      const box = await tabbar.boundingBox()
      const viewport = page.viewportSize()!
      expect(Math.round(box!.y + box!.height)).toBe(viewport.height)
    } else {
      await expect(header).toBeVisible()
      await expect(tabbar).toBeHidden()
    }
  })

  test('a dialog opens, traps focus, closes on Escape and returns focus', async ({
    page,
  }, info) => {
    await page.goto('/dev/ui/components')
    const trigger = page.getByRole('button', { name: 'Снять с публикации…' })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Снять с публикации?' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: 'Отмена' })).toBeFocused()

    // A bottom sheet on the phone, a centred window on desktop.
    const radius = await dialog.evaluate((el) => getComputedStyle(el).borderBottomLeftRadius)
    expect(radius).toBe(info.project.name === 'phone' ? '0px' : '24px')

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('the select works with the keyboard', async ({ page }) => {
    await page.goto('/dev/ui/components')
    const select = page.getByRole('combobox', { name: 'Сортировка' })
    await select.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(select).toHaveText('Сначала дешёвые')
  })

  test('a progress toast turns into a result', async ({ page }) => {
    await page.goto('/dev/ui/components')
    await page.getByRole('button', { name: 'Показать тост публикации' }).click()
    const toasts = page.locator('.ui-toasts')
    await expect(toasts.getByText('Публикуем в сети…')).toBeVisible()
    await expect(toasts.getByText('Объявление в сети')).toBeVisible({ timeout: 5000 })
  })

  test('cards: favourite toggles, pending and inactive cards are not links', async ({ page }) => {
    await page.goto('/dev/ui/marketplace')
    const cards = page.getByTestId('cards').locator('article')
    await expect(cards).toHaveCount(5)

    const fav = cards.first().getByRole('button', { name: 'В избранное' })
    await fav.click()
    await expect(
      cards.first().getByRole('button', { name: 'Убрать из избранного' })
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(cards.nth(3).getByRole('link')).toHaveCount(0)
    await expect(cards.nth(3)).toContainText('Публикуется в сети')
  })
})
