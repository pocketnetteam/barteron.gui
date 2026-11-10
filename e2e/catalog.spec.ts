import { expect, test, type Page } from '@playwright/test'

/**
 * Stage 3 on the mock network: home, catalog with filters and search, the
 * place filter and the map. Desktop and phone; nothing leaves the machine.
 */
const ME = 'PMockUser1111111111111111111111111'
let outside: string[] = []

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768
const list = (page: Page) => page.getByTestId('offer-list')

test.beforeEach(async ({ page }) => {
  // The renewal reminder (stage 4) would cover the page: e2e/item.spec.ts tests it.
  await page.addInitScript(
    (me) => localStorage.setItem(`${me}_autorenew_snooze`, String(Date.now())),
    ME
  )
  outside = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http') && url.hostname !== 'localhost') outside.push(url.href)
  })
})

test.afterEach(() => {
  expect(outside).toEqual([])
})

test('home: tiles, hints, a match for my offer and new offers with «show more»', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByTestId('category-tiles')).toContainText('Велосипеды')
  // My laptop wants a mountain bike; Ilya's bike accepts laptops.
  await expect(page.getByTestId('may-match')).toContainText('Велосипед горный, рама M')
  await expect(page.getByTestId('may-match')).toContainText('Ноутбук')
  const feed = page.getByTestId('new-offers').locator('article')
  const first = await feed.count()
  expect(first).toBeGreaterThanOrEqual(12)
  await page.getByTestId('show-more').click()
  await expect.poll(() => feed.count()).toBeGreaterThan(first)
})

test('a category lists its subcategories and offers; a tile leads there', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('category-tiles').locator('a[href="/category/1000"]').click()
  await expect(page).toHaveURL(/\/category\/1000$/)
  await expect(page.getByTestId('catalog-title')).toHaveText('Велосипеды, самокаты, гироскутеры')
  await expect(list(page)).toContainText('Stels Navigator 300')
  await expect(list(page)).not.toContainText('Кофе в зёрнах')
})

test('filters in the address: price from the node, condition here', async ({ page }) => {
  await page.goto('/category/1000?price=100-400')
  await expect(list(page)).toContainText('BMX Stark Madness')
  await expect(list(page)).not.toContainText('Горный Forward')
  if (!isPhone(page)) await expect(page.getByTestId('catalog')).toContainText('100–400 PKOIN')

  await page.goto('/category/1000?condition=new')
  await expect(list(page)).toContainText('Детский велосипед 16″')
  await expect(list(page)).not.toContainText('BMX Stark Madness')
})

test('filters panel: a price preset applies on «show»', async ({ page }) => {
  await page.goto('/category/1000')
  await expect(list(page)).toContainText('Велосипед горный, рама M')
  if (isPhone(page)) {
    await page.getByTestId('mobile-filters').click()
    await page.getByRole('dialog').getByRole('button', { name: '100–500' }).click()
    await page.getByTestId('filters-show').click()
  } else {
    await page.getByTestId('filters').getByRole('button', { name: '100–500' }).click()
    await page.getByTestId('filters-apply').click()
  }
  await expect(page).toHaveURL(/price=100-500/)
  await expect(list(page)).not.toContainText('Велосипед горный, рама M')
  await expect(list(page)).toContainText('Складной велосипед 20″')
})

test('search from the header finds offers in all categories', async ({ page }) => {
  await page.goto('/')
  if (isPhone(page)) {
    await page.getByTestId('mobile-search').click()
    await page.getByRole('dialog').getByRole('searchbox').fill('велосипед')
    await page.getByRole('dialog').getByRole('searchbox').press('Enter')
  } else {
    await page.getByRole('searchbox').first().fill('велосипед')
    await page.getByRole('searchbox').first().press('Enter')
  }
  await expect(page).toHaveURL(/\/category\/search\?search=/)
  await expect(page.getByTestId('catalog-title')).toHaveText('«велосипед»')
  await expect(list(page)).toContainText('Детский велосипед 16″')
  // The search goes to the history on this device.
  const history = await page.evaluate((me) => localStorage.getItem(`${me}_search_history`), ME)
  expect(JSON.parse(history ?? '[]')).toContain('велосипед')
})

test('nothing found says why and offers the next step', async ({ page }) => {
  await page.goto('/category/1000?search=тандем')
  await expect(page.getByTestId('catalog-empty')).toContainText('По запросу «тандем» ничего нет')
  await page.getByRole('link', { name: 'Искать во всех категориях' }).click()
  await expect(page).toHaveURL(/\/category\/search\?search=/)
})

test('place filter: saved under the old key and shown in the lists', async ({ page }) => {
  await page.goto('/')
  if (isPhone(page)) {
    await page.locator('.home-top__place').click()
  } else {
    await page.getByTestId('header-location').click()
  }
  await page.getByTestId('location-panel').getByRole('radio', { name: '25 км' }).click()
  await page.getByTestId('location-save').click()
  const stored = await page.evaluate((me) => localStorage.getItem(`${me}_location`), ME)
  const location = JSON.parse(stored ?? '{}')
  expect(typeof location.bounds?._southWest?.lat).toBe('number')
  expect(location.zoom).toBe(10)
  await expect(page.getByTestId('new-offers')).toContainText('25 км вокруг')
})

test('favourites: the heart keeps the id under the old key', async ({ page }) => {
  await page.goto('/category/1000')
  await list(page)
    .locator('article')
    .first()
    .getByRole('button', { name: /избранное/i })
    .click()
  const liked = await page.evaluate((me) => localStorage.getItem(`${me}_like`), ME)
  expect(JSON.parse(liked ?? '[]')).toHaveLength(1)
})

test('map: offers of the area; «search this area» saves it as the filter', async ({ page }) => {
  await page.goto('/category/1000/map')
  await expect(page.getByTestId('map-page')).toBeVisible()
  await expect(page.locator('.omap-pin').first()).toBeVisible()
  await page.getByTestId('search-here').click()
  await expect(page.getByTestId('search-here')).toBeHidden()
  const stored = await page.evaluate((me) => localStorage.getItem(`${me}_location`), ME)
  expect(JSON.parse(stored ?? '{}').bounds).toBeTruthy()
})
