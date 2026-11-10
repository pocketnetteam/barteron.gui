import { expect, test } from '@playwright/test'

/** Outside Bastyon the dev build runs on the mock SDK. */
test.describe('mock SDK in a plain browser', () => {
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
    await page.getByRole('link', { name: '/barter/safedeal?deal=demo' }).click()
    await expect(page).toHaveURL(/\/barter\/safedeal\?deal=demo$/)
    await expect(page.getByTestId('stub-title')).toContainText('SafeDeal')
    await expect(page.getByTestId('stub-query')).toHaveText('{"deal":"demo"}')
  })

  test('a shared link opens directly', async ({ page }) => {
    const hash = 'b'.repeat(64)
    await page.goto(`/barter/${hash}`)
    await expect(page.getByTestId('stub-title')).toContainText('barterItem')
    await expect(page.getByTestId('stub-params')).toHaveText(`{"id":"${hash}"}`)
  })

  test('an unknown path shows "not found"', async ({ page }) => {
    await page.goto('/no/such/page')
    await expect(page.getByTestId('not-found')).toBeVisible()
  })
})
