import { expect, test } from '@playwright/test'

/**
 * Stage 2 data layer on the mock network (/dev/ui/data): the feed reads
 * page by page, publishing walks through the network statuses, and nothing
 * leaves the machine.
 */
// Requests that left the machine during the current test.
let outside: string[] = []

test.describe('data layer', () => {
  test.beforeEach(async ({ page }) => {
    // The mock must stay offline: any outside request fails the test.
    outside = []
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.protocol.startsWith('http') && url.hostname !== 'localhost') outside.push(url.href)
    })
  })

  test.afterEach(() => {
    expect(outside).toEqual([])
  })

  test('feed from the node, «show more» adds the next page', async ({ page }) => {
    await page.goto('/dev/ui/data')
    const feed = page.getByTestId('data-feed')
    await expect(feed.locator('article')).toHaveCount(4)
    await expect(feed).toContainText('Велосипед горный, рама M')
    // Price with the rouble equivalent and categories by name.
    await expect(feed).toContainText('3 900 PKOIN')
    await expect(feed).toContainText('Ноутбуки')
    await page.getByRole('button', { name: 'Показать ещё' }).click()
    await expect(feed.locator('article')).toHaveCount(8)
    await expect(page.getByTestId('rate-line')).toContainText('1 PKOIN')
  })

  test('publishing: sending → waiting for a block → in the network, then in the feed', async ({
    page,
  }) => {
    await page.goto('/dev/ui/data')
    await expect(page.getByTestId('data-feed').locator('article')).toHaveCount(4)
    await page.getByTestId('publish').click()
    const list = page.getByTestId('tx-list')
    await expect(list).toContainText('Ждём блок')
    // Shown among my offers while it waits.
    await expect(page.getByTestId('my-offers')).toContainText('Тестовое объявление 1')
    await expect(list).toContainText('В сети', { timeout: 10_000 })
    await expect(page.getByTestId('data-feed').locator('article').first()).toContainText(
      'Тестовое объявление 1'
    )
  })

  test('a node refusal says so and offers a retry', async ({ page }) => {
    await page.goto('/dev/ui/data')
    await page.getByRole('button', { name: 'С отказом ноды' }).click()
    const list = page.getByTestId('tx-list')
    await expect(list).toContainText('Не опубликовано')
    await expect(list).toContainText('not enough PKOIN')
    await expect(list.getByRole('button', { name: 'Повторить' })).toBeVisible()
  })
})
