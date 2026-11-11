import { expect, test } from '@playwright/test'

/** Outside Bastyon the dev build runs on the mock SDK. */
test.describe('mock SDK in a plain browser', () => {
  // The renewal reminder (stage 4) would cover the page: e2e/item.spec.ts tests it.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'PMockUser1111111111111111111111111_autorenew_snooze',
        String(Date.now())
      )
    )
  })

  test('status page shows the mock connection and the user address', async ({ page }) => {
    await page.goto('/dev/status')
    await expect(page.getByTestId('status-mode')).toHaveText('Заглушка SDK')
    await expect(page.getByTestId('status-account')).toHaveText(
      'PMockUser1111111111111111111111111'
    )
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  })

  test('home opens with categories and new offers', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('home')).toBeVisible()
    await expect(page.getByTestId('category-tiles')).toContainText('Транспорт')
    await expect(page.getByTestId('new-offers').locator('article').first()).toBeVisible()
  })

  test('route links open the matching screens', async ({ page }) => {
    await page.goto('/dev/status')
    // «О проекте» is the last stub (stage 9).
    await page.getByRole('link', { name: '/about' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.getByTestId('stub-title')).toContainText('about')
    // A deal link without its parameters: the deal page says the link is broken.
    await page.goto('/dev/status')
    await page.getByRole('link', { name: '/barter/safedeal?deal=demo' }).click()
    await expect(page.getByTestId('deal-bad')).toBeVisible()
  })

  test('a shared link opens directly', async ({ page }) => {
    // An offer the network does not know: the offer page says so.
    await page.goto(`/barter/${'b'.repeat(64)}`)
    await expect(page.getByTestId('item-missing')).toBeVisible()
  })

  test('an unknown path shows "not found"', async ({ page }) => {
    await page.goto('/no/such/page')
    await expect(page.getByTestId('not-found')).toBeVisible()
  })
})
