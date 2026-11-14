import { expect, test, type Page } from '@playwright/test'

/**
 * Stage 6 on the mock network: my cabinet (offers, drafts, «Мой список»,
 * roles, notifications, settings) and a seller's public profile. Profile
 * writes reach the host as `barteron.account`; notifications go to the
 * in-memory p2p.back. Nothing leaves the machine.
 */
const ME = 'PMockUser1111111111111111111111111'
const ILYA = 'PDemoIyaPetrov'.padEnd(34, '1')
/** Same as `demoTxid` in src/sdk/mock-data.ts. */
const id = (label: string) =>
  Array.from(label)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(64, 'a')
    .slice(0, 64)
const HEADPHONES = id('headphones-mine')

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

/** Navigates inside the app: a reload would start the mock network afresh. */
const spaGo = (page: Page, path: string) =>
  page.evaluate((to) => {
    history.pushState({}, '', to)
    dispatchEvent(new PopStateEvent('popstate'))
  }, path)

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

test('my offers: active, inactive, renewing one that runs out', async ({ page }) => {
  await page.goto(`/profile/${ME}#ads`)
  const section = page.getByTestId('cabinet-ads')
  await expect(section.getByRole('tab', { name: /Активные/ })).toContainText('2')
  await expect(section.getByRole('tab', { name: /Неактивные/ })).toContainText('2')

  const headphones = page.locator(`[data-testid="my-offer"][data-id="${HEADPHONES}"]`)
  await expect(headphones.getByTestId('my-offer-status')).toContainText('Истекает через')
  await headphones.getByTestId('my-offer-renew').click()
  await page.getByRole('button', { name: 'Опубликовать', exact: true }).click()

  const [sent] = await callsOf(page, 'barteron.offer')
  expect(sent!.args[0]).toMatchObject({ hash: HEADPHONES, published: 'published', address: ME })
  // The row shows the network status, then it is back in the network.
  await expect(headphones).toContainText(/Отправляем|в блоке|Ждём/i)

  await section.getByRole('tab', { name: /Неактивные/ }).click()
  await expect(page.getByTestId('my-offer')).toHaveCount(2)
  await expect(page.getByTestId('my-offer').first()).toContainText('Снято с публикации')
})

test('drafts kept on the device: continue and delete', async ({ page }) => {
  await page.addInitScript(
    (me) =>
      localStorage.setItem(
        `${me}_offer_draft`,
        JSON.stringify({
          v: 1,
          caption: 'Велосипед детский',
          photos: [],
          tags: [],
          updatedAt: Date.now() - 3600_000,
        })
      ),
    ME
  )
  await page.goto(`/profile/${ME}#ads`)
  await page.getByRole('tab', { name: /Черновики/ }).click()
  const row = page.getByTestId('my-draft')
  await expect(row).toContainText('Велосипед детский')
  await expect(row).toContainText('сохранён')

  await row.getByTestId('my-draft-continue').click()
  await expect(page).toHaveURL(/\/barter\/create/)
  await expect(page.getByTestId('create-caption')).toHaveValue('Велосипед детский')

  await page.goBack()
  await page.getByRole('tab', { name: /Черновики/ }).click()
  await page.getByTestId('my-draft-remove').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Удалить' }).click()
  await expect(page.getByTestId('my-draft')).toHaveCount(0)
  expect(await page.evaluate((me) => localStorage.getItem(`${me}_offer_draft`), ME)).toBeNull()
})

test('«Мой список»: saved to the profile, the rest of it stays', async ({ page }) => {
  if (isPhone(page)) {
    await page.goto(`/profile/${ME}`)
    await page.getByTestId('cabinet-menu-mylist').click()
    await expect(page.getByTestId('cabinet-mylist')).toBeVisible()
  } else {
    await page.goto(`/profile/${ME}#settings`)
  }
  const list = page.getByTestId('mylist')
  // The demo profile: Горные and Акустические гитары.
  await expect(list.getByTestId('mylist-tag-1006')).toBeVisible()
  await list.getByRole('button', { name: /Убрать «Горные»/ }).click()
  await list.getByTestId('mylist-add').click()
  await page.getByRole('dialog').getByRole('searchbox').fill('Покеткоин')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Покеткоины/ })
    .first()
    .click()
  await expect(list.getByTestId('mylist-tag-17')).toBeVisible()
  await list.getByTestId('mylist-save').click()

  const [sent] = await callsOf(page, 'barteron.account')
  expect(sent!.args[0]).toMatchObject({ address: ME, tags: [621, 17], static: false, radius: 10 })
  expect(Object.keys(sent!.args[0] as object).sort()).toEqual(
    ['address', 'geohash', 'metaData', 'radius', 'safeDeal', 'static', 'tags'].sort()
  )
  // While the profile is on its way, the list waits.
  await expect(page.getByTestId('account-updating')).toBeVisible()
  await expect(list.getByTestId('mylist-add')).toHaveCount(0)
  // The block comes in about 4 seconds on the mock.
  await expect(page.getByTestId('account-updating')).toHaveCount(0, { timeout: 15_000 })
  await expect(list.getByTestId('mylist-tag-17')).toBeVisible()
  await expect(list.getByTestId('mylist-tag-1006')).toHaveCount(0)
})

test('roles: guarantor fee and moderator status go to the profile', async ({ page }) => {
  await page.goto(`/profile/${ME}#wallet`)
  await expect(page.getByTestId('wallet-balance')).toContainText('842,5 PKOIN')

  const guarantor = page.getByTestId('role-guarantor')
  await guarantor.getByRole('radio', { name: 'Доступен', exact: true }).click()
  await guarantor.getByTestId('guarantor-fee').fill('0')
  await expect(guarantor).toContainText('от 1 до 98')
  await expect(guarantor.getByTestId('guarantor-save')).toBeDisabled()
  await guarantor.getByTestId('guarantor-fee').fill('3')
  await guarantor.getByTestId('guarantor-save').click()

  const [sent] = await callsOf(page, 'barteron.account')
  expect((sent!.args[0] as { safeDeal: unknown }).safeDeal).toEqual({
    validator: { status: 'available', feePercent: 3 },
  })
  // One profile holds all: the moderator waits for this version.
  const moderator = page.getByTestId('role-moderator')
  await expect(moderator.getByRole('radio', { name: 'Доступен', exact: true })).toBeDisabled()
  await expect(page.getByText('Профиль обновляется в сети').first()).toBeVisible()
  await expect(moderator.getByRole('radio', { name: 'Доступен', exact: true })).toBeEnabled({
    timeout: 15_000,
  })

  await moderator.getByRole('radio', { name: 'Доступен', exact: true }).click()
  await moderator.getByTestId('moderator-save').click()
  const second = (await callsOf(page, 'barteron.account'))[1]!.args[0] as {
    safeDeal: unknown
    metaData: unknown
  }
  // The guarantor's settings from the first save stay.
  expect(second.safeDeal).toEqual({ validator: { status: 'available', feePercent: 3 } })
  expect(second.metaData).toEqual({ votingModeration: { moderator: { status: 'available' } } })
})

test('notifications: signing, a Telegram bot, a test, and the dialog notice', async ({ page }) => {
  await page.goto(`/profile/${ME}#notifications`)
  await expect(page.getByTestId('notify-signing')).toBeVisible()
  await page.getByTestId('notify-allow').click()
  await expect(page.getByTestId('notify-signing')).toHaveCount(0)

  const tg = page.getByTestId('bot-telegram')
  await expect(tg).toHaveAttribute('data-state', 'disconnected')
  await tg.getByTestId('bot-connect').click()
  await expect(tg).toContainText('Укажите username')
  await tg.getByTestId('bot-input-telegram').fill('https://t.me/anna_koval')
  await tg.getByTestId('bot-connect').click()
  await expect(tg.getByTestId('bot-connected')).toContainText('@anna_koval')

  await tg.getByTestId('bot-test').click()
  await expect(tg.getByTestId('bot-test-sent')).toBeVisible()

  await tg.getByTestId('bot-disconnect').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Отключить' }).click()
  await expect(tg).toHaveAttribute('data-state', 'disconnected')

  // Илья has a bot: a chat with him tells him in Telegram, without names or links.
  await page.goto(`/profile/${ILYA}`)
  await expect(page.getByTestId('profile-name')).toHaveText('Илья Петров')
  await page.evaluate(async (ilya) => {
    const w = window as {
      __barteronMock?: { granted: Set<string> }
      __barteronNotify?: {
        connect(c: string, r: { address: string; name: string; locale: string }): Promise<void>
      }
    }
    w.__barteronMock!.granted.add('sign')
    await w.__barteronNotify!.connect('telegram', { address: ilya, name: 'ilya', locale: 'ru' })
  }, ILYA)
  await page.getByTestId('profile-write').click()
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as { __barteronNotify?: { sent: unknown[] } }).__barteronNotify?.sent ?? []
      )
    )
    .toEqual([{ address: ILYA, type: 'dialog', channel: 'telegram' }])
  const [room] = await callsOf(page, 'chat.getOrCreateRoom')
  expect((room!.args[0] as { users: string[] }).users).toEqual([ILYA])
})

test('public profile: roles, the exchange list, offers and reviews', async ({ page }) => {
  await page.goto(`/profile/${ILYA}`)
  await expect(page.getByTestId('profile-name')).toHaveText('Илья Петров')
  await expect(page.getByTestId('profile-guarantor')).toContainText('2%')
  await expect(page.getByTestId('profile-moderator')).toBeVisible()
  await expect(page.getByTestId('profile-offers').locator('article, a').first()).toBeVisible()
  if (!isPhone(page)) {
    await expect(page.getByTestId('profile-wants')).toContainText('Покеткоины')
    await expect(page.getByText('Последние отзывы')).toBeVisible()
  }

  // The old hash opens the reviews.
  await page.goto(`/profile/${ILYA}#votes`)
  await expect(page.getByTestId('profile-reviews')).toContainText('Мария В.')

  // My own profile as others see it, with the way back to the cabinet.
  await page.goto(`/profile/${ME}#public`)
  await expect(page.getByTestId('profile-self')).toBeVisible()
  await expect(page.getByTestId('profile-write')).toHaveCount(0)
  await page.getByTestId('profile-self').getByRole('link', { name: 'В кабинет' }).click()
  await expect(page.getByTestId('cabinet')).toBeVisible()
})

test('a profile the node did not give: said so, not «нет объявлений»; then «Обновить»', async ({
  page,
}) => {
  const offline = (on: boolean) =>
    page.evaluate(
      (v) =>
        (
          window as unknown as { __barteronMock: { setOffline(v: boolean): void } }
        ).__barteronMock.setOffline(v),
      on
    )
  await page.goto('/')
  await expect(page.getByTestId('home')).toBeVisible()
  await offline(true)
  await spaGo(page, `/profile/${ILYA}`)
  const failed = page.getByTestId('profile-failed')
  await expect(failed).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('profile-offers-failed')).toBeVisible()
  await expect(page.getByTestId('profile-no-offers')).toHaveCount(0)
  await expect(page.getByText('Нет оценок')).toHaveCount(0)

  await offline(false)
  await failed.getByRole('button', { name: 'Обновить' }).click()
  await expect(failed).toHaveCount(0)
  await expect(page.getByTestId('profile-offers').locator('article, a').first()).toBeVisible()
})

test('only his offers or only his Barteron profile not given: each said so', async ({ page }) => {
  // Each read is tried twice (one retry).
  await page.addInitScript((who) => {
    ;(window as { __barteronMockSetup?: unknown }).__barteronMockSetup = {
      failRpc: [
        { method: 'getbarteronoffersbyaddress', with: who, times: 2 },
        { method: 'getbarteronaccounts', with: who, times: 2 },
      ],
    }
  }, ILYA)
  await page.goto(`/profile/${ILYA}`)
  const failed = page.getByTestId('profile-failed')
  await expect(failed).toBeVisible({ timeout: 10_000 })
  // His Bastyon name came; his offers and scores did not.
  await expect(page.getByTestId('profile-name')).toHaveText('Илья Петров')
  await expect(page.getByTestId('profile-offers-failed')).toBeVisible()
  await expect(page.getByText('Нет оценок')).toHaveCount(0)
  await failed.getByRole('button', { name: 'Обновить' }).click()
  await expect(failed).toHaveCount(0)
  await expect(page.getByTestId('profile-guarantor')).toBeVisible()
  await expect(page.getByTestId('profile-offers').locator('article, a').first()).toBeVisible()
})

test('only his offers not given: the profile says not all of it loaded', async ({ page }) => {
  await page.addInitScript((who) => {
    ;(window as { __barteronMockSetup?: unknown }).__barteronMockSetup = {
      failRpc: [{ method: 'getbarteronoffersbyaddress', with: who, times: 2 }],
    }
  }, ILYA)
  await page.goto(`/profile/${ILYA}`)
  await expect(page.getByTestId('profile-failed')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('profile-guarantor')).toBeVisible()
})

test('settings: the place for new offers fills the offer form', async ({ page }) => {
  await page.goto(`/profile/${ME}#settings`)
  const place = page.getByTestId('settings-place')
  await place.getByRole('radio', { name: 'Эта точка' }).click()
  // Leaflet comes in its own chunk: a tap before it is there is lost.
  await expect(page.getByTestId('create-map')).toHaveClass(/leaflet-container/)
  await page.getByTestId('create-map').click()
  await page.getByTestId('home-place-save').click()

  const [sent] = await callsOf(page, 'barteron.account')
  const payload = sent!.args[0] as { static: boolean; geohash: string; tags: number[] }
  expect(payload.static).toBe(true)
  // The open profile gets the place only roughly, about a kilometre.
  expect(payload.geohash).toMatch(/^[0-9b-hjkmnp-z]{6}$/)
  expect(payload.tags).toEqual([1006, 621])
  await expect(page.getByTestId('account-updating')).toHaveCount(0, { timeout: 15_000 })

  // A new offer starts at that point: the place step already has it.
  await spaGo(page, '/barter/create?step=4')
  await expect(page.getByTestId('create-place-name')).toBeVisible()

  // Theme and language stay on the device.
  await page.goto(`/profile/${ME}#settings`)
  // On a phone the section is «Настройки и помощь»: the theme is a sheet (s8-sheets-mobile).
  if (isPhone(page)) await page.getByTestId('settings-menu').locator('[data-row="theme"]').click()
  await page.getByRole('radio', { name: 'Тёмная' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('the cabinet is reached from the header and the tab bar', async ({ page }) => {
  await page.goto('/')
  if (isPhone(page)) {
    await page.getByRole('navigation').getByText('Профиль', { exact: true }).click()
    await expect(page.getByTestId('cabinet-menu')).toBeVisible()
    await page.getByTestId('cabinet-menu-wallet').click()
    await expect(page.getByTestId('cabinet-wallet')).toBeVisible()
    await page.getByTestId('top-back').click()
    await expect(page.getByTestId('cabinet-menu')).toBeVisible()
  } else {
    await page.getByTestId('header-account').click()
    await page.getByTestId('profile-menu').getByText('Настройки').click()
    await expect(page.getByTestId('cabinet-settings')).toBeVisible()
    await page.getByTestId('cabinet-nav-favorites').click()
    await expect(page).toHaveURL(/#favorites$/)
    await expect(page.getByTestId('saved-empty')).toBeVisible()
  }
})
