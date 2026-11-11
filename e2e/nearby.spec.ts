import { expect, test, type Page } from '@playwright/test'

/**
 * Stage 10 on the mock network: «Что продают рядом». Like the real node, the
 * mock's feed brings withdrawn and expired offers too; the page counts only
 * what the catalog shows. Nothing leaves the machine.
 */
const ME = 'PMockUser1111111111111111111111111'
let outside: string[] = []

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768

/** The place filter under the old key: a square around the centre. */
function area([lat, lng]: [number, number], radiusKm: number) {
  const R = 6371
  const dLat = (180 / (Math.PI * R)) * radiusKm
  const dLng = (360 / (2 * Math.PI * Math.cos((lat * Math.PI) / 180) * R)) * radiusKm
  return {
    geohash: null,
    zoom: 11,
    bounds: {
      _southWest: { lat: lat - dLat, lng: lng - dLng },
      _northEast: { lat: lat + dLat, lng: lng + dLng },
    },
  }
}
const MOSCOW = area([55.7522, 37.6156], 10)
const TVER = area([56.8587, 35.9176], 10)

async function openAt(page: Page, location: ReturnType<typeof area> | null) {
  await page.addInitScript(
    ([me, loc]) => {
      localStorage.setItem(`${me}_autorenew_snooze`, String(Date.now()))
      if (loc) localStorage.setItem(`${me}_location`, JSON.stringify(loc))
    },
    [ME, location] as const
  )
  await page.goto('/nearby')
}

interface Call {
  method: string
  args: unknown[]
}
const rpcCalls = (page: Page, name: string) =>
  page.evaluate(
    (m) =>
      ((window as { __barteronMock?: { calls: Call[] } }).__barteronMock?.calls ?? []).filter(
        (c) => c.method === 'rpc' && c.args[0] === m
      ),
    name
  )

test.beforeEach(async ({ page }) => {
  outside = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http') && url.hostname !== 'localhost') outside.push(url.href)
  })
})

test.afterEach(() => {
  expect(outside).toEqual([])
})

test('reached from the home page; without a place it asks for one', async ({ page }) => {
  await page.addInitScript(
    (me) => localStorage.setItem(`${me}_autorenew_snooze`, String(Date.now())),
    ME
  )
  await page.goto('/')
  await page.getByTestId('home-nearby').click()
  await expect(page).toHaveURL(/\/nearby$/)
  const state = page.locator('[data-kind="nearby-place"]')
  await expect(state).toContainText('Выберите место')
  await state.getByRole('button', { name: 'Выбрать на карте' }).click()
  await expect(page.getByTestId('location-panel')).toBeVisible()
})

test('around Moscow: totals, categories, districts and the newest offers', async ({ page }) => {
  await openAt(page, MOSCOW)
  const stats = page.getByTestId('nearby-stats')
  await expect(stats).toHaveText(/^\d+ объявлени[ея]? от \d+ продавц/)
  const total = Number((await stats.textContent())!.match(/\d+/)![0])

  // Categories add up to the total: every offer around has a known category.
  const tiles = page.getByTestId('nearby-categories').locator('a')
  await expect(tiles.first()).toBeVisible()
  const counts = await page
    .getByTestId('nearby-categories')
    .locator('.ncats__count')
    .allTextContents()
  const more = page.getByTestId('nearby-categories').getByRole('button', { name: /Все категории/ })
  if (await more.isVisible()) {
    await more.click()
    counts.splice(0, counts.length, ...(await page.locator('.ncats__count').allTextContents()))
  }
  expect(counts.reduce((s, c) => s + Number(c), 0)).toBe(total)
  await expect(page.locator('a[data-category="1000"]')).toContainText('Велосипеды')

  // One page of the feed, no node counts while the area has offers.
  const feed = await rpcCalls(page, 'getbarteronfeed')
  expect(feed.some((c) => (c.args[1] as [{ pageSize?: number }])[0].pageSize === 200)).toBe(true)
  expect(await rpcCalls(page, 'getbarterongroups')).toHaveLength(0)

  await expect(page.getByTestId('nearby-map')).toBeVisible()
  await expect(page.getByTestId('nearby-fresh').locator('article').first()).toBeVisible()
  await page.locator('a[data-category="1000"]').click()
  await expect(page).toHaveURL(/\/category\/1000$/)
})

test('a district narrows everything down, «Вся область» brings it back', async ({ page }) => {
  await openAt(page, MOSCOW)
  const first = page.locator('.ndist').first()
  const count = Number(await first.locator('.ndist__count').textContent())
  await first.click()
  const scope = page.getByTestId('nearby-scope')
  await expect(scope).toContainText('Район:')
  await expect(page.getByTestId('nearby-fresh')).toContainText('Объявления в этом районе')
  await expect(page.getByTestId('nearby-fresh').locator('article')).toHaveCount(Math.min(count, 10))
  await scope.getByRole('button', { name: 'Вся область' }).click()
  await expect(scope).toBeHidden()
  await expect(page.getByTestId('nearby-fresh')).toContainText('Свежие объявления')
  if (isPhone(page)) await expect(page.getByRole('button', { name: /Все районы/ })).toBeVisible()
})

test('an empty area points at the nearest offers, «Смотреть» moves there', async ({ page }) => {
  await openAt(page, TVER)
  await expect(page.getByTestId('nearby-empty')).toContainText(
    'В радиусе 10 км пока ничего не продают'
  )
  const place = page.getByTestId('nearby-places').locator('.nplace').first()
  await expect(place).toContainText('км к юго-востоку')
  await place.getByRole('button', { name: 'Смотреть' }).click()
  await expect(page.getByTestId('nearby-stats')).toHaveText(/объявлени/)
  const stored = await page.evaluate((me) => localStorage.getItem(`${me}_location`), ME)
  expect(JSON.parse(stored ?? '{}').bounds._southWest.lat).toBeLessThan(56)
})
