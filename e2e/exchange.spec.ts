import { expect, test, type Page } from '@playwright/test'

/**
 * Stage 7 on the mock network: exchanges for my offers. My laptop has one
 * direct exchange (Илья's mountain bike wants laptops) and one chain of
 * three (my laptop → Илья's tablet → Мария's road bike → me). The
 * headphones find nothing. Chats go to the mock host; nothing leaves the
 * machine.
 */
const ME = 'PMockUser1111111111111111111111111'
const ILYA = 'PDemoIyaPetrov'.padEnd(34, '1')
const MARIA = 'PDemoMariaV'.padEnd(34, '1')
/** Same as `demoTxid` in src/sdk/mock-data.ts. */
const id = (label: string) =>
  Array.from(label)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(64, 'a')
    .slice(0, 64)
const LAPTOP = id('laptop-mine')
const HEADPHONES = id('headphones-mine')
const MY_TABLET = id('tablet-mine')
const BIKE = id('bike')
const ROAD_BIKE = id('road-bike')
const TABLET = id('tablet-ilya')
const applink = (path: string) =>
  `bastyon://application?id=barteron.pocketnet.app&p=${encodeURIComponent(path)}`

interface Call {
  method: string
  args: unknown[]
}
const callsOf = (page: Page, method: string) =>
  page.evaluate(
    (m) =>
      ((window as { __barteronMock?: { calls: Call[] } }).__barteronMock?.calls ?? []).filter(
        (c) => c.method === m
      ),
    method
  )

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768

let outside: string[] = []

test.beforeEach(async ({ page }) => {
  outside = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http') && url.hostname !== 'localhost') outside.push(url.href)
  })
  await page.addInitScript(
    (me) => localStorage.setItem(`${me}_autorenew_snooze`, String(Date.now())),
    ME
  )
})

test.afterEach(() => {
  expect(outside).toEqual([])
})

test('the exchanges section: by my offers, and every offer once', async ({ page }) => {
  await page.goto(`/profile/${ME}#barters`)
  const section = page.getByTestId('cabinet-barters')
  const laptop = section.locator(`[data-testid="exchange-offer"][data-id="${LAPTOP}"]`)
  await expect(laptop).toHaveAttribute('data-status', 'ready')
  if (isPhone(page)) await expect(laptop).toContainText('2 варианта')
  else {
    await expect(laptop.getByTestId('exchange-offer-all')).toHaveText('Все варианты · 2')
    await expect(page.getByTestId('cabinet-nav-barters')).toContainText('2')
  }
  await expect(laptop.locator('[data-testid="exchange-tile"][data-kind="direct"]')).toHaveCount(1)
  await expect(laptop.locator('[data-testid="exchange-tile"][data-kind="chain"]')).toHaveCount(1)

  const headphones = section.locator(`[data-testid="exchange-offer"][data-id="${HEADPHONES}"]`)
  await expect(headphones).toHaveAttribute('data-status', 'ready')
  await expect(headphones).toContainText('Пока нет вариантов')
  // Withdrawn and expired offers are not matched.
  await expect(section.locator(`[data-id="${MY_TABLET}"]`)).toHaveCount(0)

  await section.getByRole('radio', { name: /Подходит мне · 2/ }).click()
  const fits = page.getByTestId('exchanges-fits')
  await expect(fits.getByTestId('exchange-tile')).toHaveCount(2)
  await expect(fits).toContainText('За ваш «Ноутбук 14", 16 ГБ»')

  // A chain tile opens the chain page.
  await fits.locator('[data-kind="chain"]').getByRole('link').click()
  await expect(page).toHaveURL(/\/barter\/search\?source=/)
  await expect(page.getByTestId('chain-page')).toHaveAttribute('data-state', 'ready')
})

test('«Мои объявления» count the exchanges and lead to the options', async ({ page }) => {
  await page.goto(`/profile/${ME}#ads`)
  const row = page.locator(`[data-testid="my-offer"][data-id="${LAPTOP}"]`)
  await expect(row.getByTestId('my-offer-variants')).toHaveText('2 варианта обмена')
  await row.getByTestId('my-offer-variants').click()
  await expect(page).toHaveURL(new RegExp(`/barter/exchange/${LAPTOP}`))
  await expect(page.getByTestId('exchange-options')).toHaveAttribute('data-state', 'ready')
})

test('a direct exchange: why it fits, then the chat with the seller', async ({ page }) => {
  await page.goto(`/barter/exchange/${LAPTOP}?expanded=1`)
  const direct = page.locator(`[data-testid="direct-match"][data-id="${BIKE}"]`)
  await expect(direct).toContainText('Велосипед горный, рама M')
  await expect(direct).toContainText('Хочет «Ноутбуки»')
  await expect(page.getByTestId('exchange-direct')).toContainText('Прямые обмены · 1')
  await expect(page.getByTestId('exchange-chains')).toContainText('Цепочки из трёх · 1')

  await direct.getByTestId('direct-propose').click()
  const dialog = page.getByRole('dialog', { name: 'Предложить обмен?' })
  await expect(dialog).toContainText('Ноутбук 14", 16 ГБ')
  await dialog.getByTestId('propose-confirm').click()
  await expect(dialog).toBeHidden()

  const [room] = await callsOf(page, 'chat.getOrCreateRoom')
  expect(room?.args[0]).toEqual({ users: [ILYA], parameters: { name: 'Ноутбук 14", 16 ГБ' } })
  const [sent] = await callsOf(page, 'chat.send')
  expect(sent?.args[0]).toEqual({
    roomid: 'mock-room',
    content: {
      messages: [applink(`barter/${LAPTOP}`), applink(`barter/${BIKE}`), 'Предлагаю обмен'],
      images: [],
    },
  })
})

test('a chain of three: who gives what, then the group chat', async ({ page }) => {
  await page.goto(`/barter/exchange/${LAPTOP}?expanded=1`)
  await page.getByTestId('chain-open').click()
  const chain = page.getByTestId('chain-page')
  await expect(chain).toHaveAttribute('data-role', 'source')
  await expect(page).toHaveURL(new RegExp(`source=${LAPTOP}&target=${ROAD_BIKE}&via=${TABLET}`))
  await expect(chain).toContainText('Вы отдаёте')
  await expect(chain).toContainText('Илья Петров отдаёт')
  await expect(chain).toContainText('Мария В. отдаёт вам')
  await expect(page.getByTestId('chain-my-side')).toContainText('2 600 PKOIN в вашу пользу')

  await page.getByTestId(isPhone(page) ? 'chain-propose-bar' : 'chain-propose').click()
  const dialog = page.getByRole('dialog', { name: 'Создать групповой чат?' })
  await expect(dialog).toContainText('Илья Петров · отдаёт')
  await dialog.getByTestId('propose-confirm').click()
  await expect(dialog).toBeHidden()

  const [room] = await callsOf(page, 'chat.getOrCreateRoom')
  expect(room?.args[0]).toEqual({
    users: [ILYA, MARIA],
    parameters: { name: 'Групповой обмен' },
  })
  const [sent] = await callsOf(page, 'chat.send')
  expect(sent?.args[0]).toEqual({
    roomid: 'mock-room',
    content: {
      messages: [applink(`barter/search?source=${LAPTOP}&target=${ROAD_BIKE}&via=${TABLET}`)],
      images: [],
    },
  })
})

test('an old chain link without via finds the chain again', async ({ page }) => {
  await page.goto(`/barter/search?source=${LAPTOP}&target=${ROAD_BIKE}`)
  const chain = page.getByTestId('chain-page')
  await expect(chain).toHaveAttribute('data-state', 'ready')
  await expect(chain).toContainText('Планшет 10", 64 ГБ, с чехлом-клавиатурой')
})

test('a chain with an offer no longer live says so and cannot be offered', async ({ page }) => {
  await page.goto(`/barter/search?source=${LAPTOP}&target=${ROAD_BIKE}&via=${MY_TABLET}`)
  await expect(page.getByTestId('chain-page')).toHaveAttribute('data-state', 'broken')
  await expect(page.getByTestId('chain-broken')).toContainText('«Планшет 10"» больше не в сети')
  await expect(page.getByTestId('chain-propose')).toHaveCount(0)
  await expect(page.getByTestId('chain-propose-bar')).toHaveCount(0)
})

test('options of someone else’s offer: shown, but no «Предложить»', async ({ page }) => {
  await page.goto(`/barter/exchange/${TABLET}`)
  await expect(page.getByTestId('exchange-not-mine')).toBeVisible()
  await expect(page.getByTestId('direct-propose')).toHaveCount(0)
})

test('my offer page shows the same exchanges and links the chain', async ({ page }) => {
  await page.goto(`/barter/${LAPTOP}`)
  const section = page.locator('section[aria-labelledby="own-matches"]')
  await expect(section).toContainText('Варианты обмена · 2')
  await section
    .locator('[data-testid="exchange-tile"][data-kind="chain"]')
    .getByRole('link')
    .click()
  await expect(page).toHaveURL(/\/barter\/search\?source=/)
})
