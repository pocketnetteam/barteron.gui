import { expect, test, type Page } from '@playwright/test'

/** Stage 9 (s8): system screens, «О проекте», «Полезные советы», the app's windows. */

const ME = 'PMockUser1111111111111111111111111'
const TABLET = Array.from('tablet-ilya', (c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
  .join('')
  .padEnd(64, 'a')
  .slice(0, 64)

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768

type Mocked = { __barteronMock: { calls: { method: string; args: unknown[] }[] } }
const callsOf = async (page: Page, method: string) =>
  page.evaluate(
    (m) => (window as unknown as Mocked).__barteronMock.calls.filter((c) => c.method === m),
    method
  )

/** Navigation inside the app, without reloading the mock. */
const spaGo = (page: Page, path: string) =>
  page.evaluate((p) => {
    const app = (
      document.querySelector('#app') as unknown as {
        __vue_app__: { config: { globalProperties: { $router: { push(p: string): unknown } } } }
      }
    ).__vue_app__
    return app.config.globalProperties.$router.push(p)
  }, path)

/** Opens one of the app's windows the way a user would on this screen size. */
async function openWindow(page: Page, row: 'support' | 'survey' | 'referral' | 'legal') {
  if (isPhone(page)) {
    await page.goto(`/profile/${ME}#settings`)
    await page.getByTestId('settings-menu').locator(`[data-row="${row}"]`).click()
  } else {
    await page.goto('/about')
    if (row === 'legal') await page.goto(`/profile/${ME}#settings`)
    if (row === 'legal')
      await page.getByTestId('cabinet-settings').getByText('Юридическая информация').click()
    else await page.getByTestId(`footer-${row}`).click()
  }
}

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined)
  await page.addInitScript(
    (me) => localStorage.setItem(`${me}_autorenew_snooze`, String(Date.now())),
    ME
  )
})

test('an unknown path: «Такой страницы нет», home and search', async ({ page }) => {
  await page.goto('/barter/nothing/here')
  const view = page.getByTestId('not-found')
  await expect(view).toContainText('Такой страницы нет')
  if (isPhone(page)) {
    // s8-404-mobile: popular categories lead into the catalog.
    await view.getByRole('link', { name: 'Электроника' }).click()
    await expect(page).toHaveURL(/\/category\/7000$/)
  } else {
    await view.getByRole('link', { name: 'Искать объявления' }).click()
    await expect(page).toHaveURL(/\/category\/search$/)
  }
})

test('«О проекте»: questions open, support is one tap away', async ({ page }) => {
  await page.goto('/about')
  const about = page.getByTestId('about-page')
  await expect(about).toContainText('Меняйтесь и продавайте напрямую')
  const fee = about.locator('[data-question="fee"]')
  await fee.getByRole('button').click()
  await expect(fee).toContainText('Решает продавец')
  await about.getByTestId('about-support').click()
  await expect(page.getByTestId('support-dialog')).toContainText('support@bastyon.com')
})

test('«Полезные советы»: sections, search, a link to the form step', async ({ page }) => {
  await page.goto('/help')
  const tips = page.getByTestId('tips-page')
  await expect(tips.getByTestId('tip')).toHaveCount(8)
  await tips.locator('[data-section="barter"]').click()
  await expect(page).toHaveURL(/\/help#barter$/)
  await expect(tips).toContainText('Цепочка из трёх')

  await tips.getByTestId('tips-search').fill('видео 720p')
  await expect(tips.getByTestId('tip')).toHaveCount(1)
  await expect(tips.getByTestId('tip')).toContainText('Одно видео до 2 минут')
  await tips.getByTestId('tips-search').fill('жираф')
  await expect(tips.getByTestId('tips-nothing')).toBeVisible()

  await tips.getByTestId('tips-search').fill('')
  await tips.locator('[data-section="create"]').click()
  await tips.locator('[data-link="createExchange"]').click()
  await expect(page).toHaveURL(/\/barter\/create\?step=3$/)
})

test('support: the address is copied; a refused mailto copies it too', async ({ page }) => {
  await openWindow(page, 'support')
  const dialog = page.getByTestId('support-dialog')
  await expect(dialog).toContainText('support@bastyon.com')
  await page.getByTestId('support-copy').click()
  await expect(page.getByText('Адрес почты скопирован')).toBeVisible()

  // bastyon-nextgen opens http(s) only, like the mock (HOST-TASKS.md, item 7).
  await page.getByTestId('support-write').click()
  await expect(page.getByText(/Bastyon не открыл почту/)).toBeVisible()
  const [link] = await callsOf(page, 'openExternalLink')
  expect(String(link?.args[0])).toMatch(/^mailto:support@bastyon\.com\?subject=/)
})

test('referral: the link with my address is copied', async ({ page }) => {
  await openWindow(page, 'referral')
  await expect(page.getByTestId('referral-dialog')).toContainText('Сначала зарегистрируйтесь')
  await page.getByTestId('referral-copy').click()
  await expect(page.getByText('Реферальная ссылка скопирована')).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null)
  if (copied !== null) {
    expect(copied).toBe(`https://bastyon.com/application?id=barteron.pocketnet.app&ref=${ME}`)
  }
})

test('the survey: one answer at least, a failure keeps the text, then thanks', async ({ page }) => {
  await openWindow(page, 'survey')
  await page.getByTestId('survey-send').click()
  await expect(page.getByTestId('survey-empty')).toContainText('Ответьте хотя бы на один вопрос')

  // The mock refuses an answer starting with «!error».
  await page.getByTestId('survey-answer1').fill('!error ещё раз')
  await page.getByTestId('survey-send').click()
  await expect(page.getByTestId('survey-failed')).toContainText('Не удалось отправить ответы')
  await expect(page.getByTestId('survey-answer1')).toHaveValue('!error ещё раз')

  await page.getByTestId('survey-answer1').fill('Поиск по карте')
  await page.getByTestId('survey-email').fill('me@example.org')
  await page.getByTestId('survey-send').click()
  await expect(page.getByRole('dialog')).toContainText('Ваши ответы отправлены')
  const sent = await page.evaluate(
    () => (window as unknown as { __barteronSurvey: { sent: unknown[] } }).__barteronSurvey.sent
  )
  expect(sent).toEqual([
    {
      address: ME,
      status: 'completed',
      answer1: 'Поиск по карте',
      answer2: '',
      email: 'me@example.org',
    },
  ])
})

test('the survey invitation on the home page: «×» says no for good', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as { __barteronMockSetup?: unknown }).__barteronMockSetup = { surveyDelay: 0 }
  })
  await page.goto('/')
  const invite = page.getByTestId('survey-invite')
  await expect(invite).toContainText('Помогите улучшить Barteron')
  await invite.getByTestId('survey-invite-close').click()
  await expect(invite).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __barteronSurvey: { sent: { status: string }[] } })
            .__barteronSurvey.sent
      )
    )
    .toEqual([{ address: ME, status: 'rejected' }])
})

test('a piece of the app that did not load: «Вышла новая версия Barteron»', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home')).toBeVisible()
  // After a deploy the old chunk is gone from the server.
  await page.route('**/src/views/info/AboutView.vue*', (route) => route.abort())
  await spaGo(page, '/about').catch(() => undefined)
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Вышла новая версия Barteron')
  await expect(dialog).toContainText('Черновик объявления и избранное сохранены')
  await expect(page.getByTestId('version-restart')).toBeVisible()
})

test('storage the browser refuses: the app works, and says what will not survive a restart', async ({
  page,
}) => {
  // Chrome in incognito blocks site data of a frame from another origin:
  // Bastyon on the web opens Barteron in one, and `localStorage` throws.
  await page.addInitScript(() => {
    const real = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        // The dev server only: Vue devtools in Pinia read it unguarded at start.
        // The production bundle has no such code (AUDIT.md, stage 25).
        if (new Error().stack?.includes('/deps/pinia.js')) return real
        throw new DOMException('Access is denied for this document.', 'SecurityError')
      },
    })
  })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/')
  await expect(page.getByTestId('home')).toBeVisible()
  // Nothing remembers «Не сейчас» from before: the renewal reminder comes up.
  await page
    .getByRole('dialog', { name: /Продлить/ })
    .getByRole('button', { name: 'Не сейчас' })
    .click()

  await spaGo(page, '/barter/create')
  await page.getByTestId('create-caption').fill('Горный велосипед')
  await expect(page.getByTestId('create-not-kept')).toContainText('не сохраняется')
  await expect(page.getByTestId('create-saved')).toHaveCount(0)
  // The draft preview and the form again, in the same visit: the draft is still there.
  await spaGo(page, '/barter/draft')
  await expect(page.getByTestId('item-title')).toHaveText('Горный велосипед')
  await spaGo(page, '/barter/create')
  await expect(page.getByTestId('create-caption')).toHaveValue('Горный велосипед')

  // «Вышла новая версия» does not promise the draft is on the device.
  await page.route('**/src/views/info/AboutView.vue*', (route) => route.abort())
  await spaGo(page, '/about').catch(() => undefined)
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Вышла новая версия Barteron')
  await expect(dialog).toContainText('не сохранятся')
  await expect(dialog).not.toContainText('сохранены на устройстве')
  expect(errors).toEqual([])
})

test('a bug nothing caught: the user is told instead of a button that does nothing', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByTestId('home')).toBeVisible()
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  // What Vue does with an error thrown in a click handler or a render.
  await page.evaluate(() => {
    type Handler = (error: unknown, instance: unknown, info: string) => void
    const app = (
      document.querySelector('#app') as unknown as {
        __vue_app__: { config: { errorHandler?: Handler } }
      }
    ).__vue_app__
    app.config.errorHandler?.(new TypeError('x is undefined'), null, 'component event handler')
  })
  await expect(page.getByText('Что-то пошло не так')).toBeVisible()
  expect(errors.some((e) => e.includes('x is undefined'))).toBe(true)
})

test('the node stops answering: «Нет связи с сетью», then back', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home')).toBeVisible()
  await page.evaluate(() =>
    (
      window as unknown as { __barteronMock: { setOffline(v: boolean): void } }
    ).__barteronMock.setOffline(true)
  )
  // Each list asks the node and retries once: two lists are four failures in a row.
  await spaGo(page, '/category/7000')
  await spaGo(page, '/category/6000')
  const banner = page.getByTestId('net-banner')
  await expect(banner).toContainText('Нода не отвечает')

  await page.evaluate(() =>
    (
      window as unknown as { __barteronMock: { setOffline(v: boolean): void } }
    ).__barteronMock.setOffline(false)
  )
  await banner.getByTestId('net-retry').click()
  await expect(banner).toHaveCount(0)
})

test('the device loses the network: «Нет связи с сетью», not «Вышла новая версия»', async ({
  page,
  context,
}) => {
  // The pages were seen while online; their pieces are in memory.
  await page.goto('/')
  await expect(page.getByTestId('home')).toBeVisible()
  await spaGo(page, '/category/7000')
  await expect(page.getByTestId('catalog')).toBeVisible()
  await spaGo(page, '/')
  await expect(page.getByTestId('home')).toBeVisible()

  // The query client holds the reads instead of failing them: no «node silent», the device.
  await context.setOffline(true)
  await spaGo(page, '/category/1000')
  const banner = page.getByTestId('net-banner')
  await expect(banner).toContainText('Устройство не в сети')
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  // Back online: the held reads go, the banner leaves.
  await context.setOffline(false)
  await expect(banner).toHaveCount(0)
  await expect(page.getByTestId('offer-list')).toContainText('Stels Navigator 300')
})

test('a piece of the app not loading while offline says so, not «Вышла новая версия»', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await expect(page.getByTestId('home')).toBeVisible()
  await context.setOffline(true)
  await spaGo(page, '/about').catch(() => undefined)
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Часть Barteron не загрузилась')
  await expect(dialog).toContainText('Пропала связь с сетью')
  await expect(dialog).not.toContainText('Вышла новая версия')
  await expect(page.getByTestId('version-restart')).toBeVisible()
  await context.setOffline(false)
})

test('a new page opens at the top; «назад» returns to where the list was', async ({ page }) => {
  await page.goto('/category/search')
  const cards = page.getByTestId('offer-list').locator('article')
  await expect(cards.nth(7)).toBeVisible()
  await cards.nth(7).scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, 200))
  const down = await page.evaluate(() => Math.round(window.scrollY))
  expect(down).toBeGreaterThan(150)
  await cards.nth(7).locator('a').first().click()
  await expect(page).toHaveURL(/\/barter\//)
  await page.getByTestId('item-page').waitFor()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await page.goBack()
  await expect(cards.nth(7)).toBeVisible()
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(down)
})

test('chats turned off in Bastyon: «Нужны разрешения» with the app settings', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as { __barteronMockSetup?: unknown }).__barteronMockSetup = {
      granted: ['account'],
      refuse: true,
    }
  })
  await page.goto(`/barter/${TABLET}`)
  await page.getByTestId('item-page').waitFor()
  await page.getByRole('button', { name: 'Написать продавцу' }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Нужны разрешения')
  await expect(dialog).toContainText('чаты')
  await page.getByTestId('permissions-settings').click()
  expect(await callsOf(page, 'helpers.opensettings')).toHaveLength(1)
  expect(await callsOf(page, 'chat.getOrCreateRoom')).toHaveLength(0)
})

test('a new account the node does not know: «Аккаунт активируется» instead of a chat', async ({
  page,
}) => {
  await page.addInitScript(() => {
    ;(window as { __barteronMockSetup?: unknown }).__barteronMockSetup = { activating: true }
  })
  await page.goto(`/barter/${TABLET}`)
  await page.getByTestId('item-page').waitFor()
  await page.getByRole('button', { name: 'Написать продавцу' }).first().click()
  await expect(page.getByRole('dialog')).toContainText('Аккаунт активируется')
  await page.getByTestId('activation-ok').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await callsOf(page, 'chat.getOrCreateRoom')).toHaveLength(0)
})

test('phone «Настройки и помощь»: currency and language in sheets', async ({ page }) => {
  test.skip(!isPhone(page), 's8-menu-mobile is the phone settings')
  await page.goto(`/profile/${ME}#settings`)
  const menu = page.getByTestId('settings-menu')
  await menu.locator('[data-row="currency"]').click()
  await page.getByTestId('currency-dialog').locator('[data-code="USD"]').click()
  await expect(menu.locator('[data-row="currency"]')).toContainText('USD')

  await menu.locator('[data-row="language"]').click()
  await page.getByTestId('language-dialog').locator('[data-choice="en-US"]').click()
  await expect(menu).toContainText('Price currency')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})
