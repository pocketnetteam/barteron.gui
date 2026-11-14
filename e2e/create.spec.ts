import { expect, test, type Page } from '@playwright/test'

/**
 * Stage 5 on the mock network: the offer form — a new offer, the draft on
 * the device, photo uploads, editing, a pickup point — and the transaction
 * that reaches the host. Nothing leaves the machine.
 */
const ME = 'PMockUser1111111111111111111111111'
/** Same as `demoTxid` in src/sdk/mock-data.ts. */
const id = (label: string) =>
  Array.from(label)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(64, 'a')
    .slice(0, 64)
const LAPTOP = id('laptop-mine')

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

/** Navigation inside the app: transactions on their way live in memory only. */
const spaGo = (page: Page, path: string) =>
  page.evaluate((p) => {
    const app = (
      document.querySelector('#app') as unknown as {
        __vue_app__: { config: { globalProperties: { $router: { push(p: string): unknown } } } }
      }
    ).__vue_app__
    return app.config.globalProperties.$router.push(p)
  }, path)

const failNext = (page: Page, method: string) =>
  page.evaluate(
    (m) =>
      (
        window as unknown as { __barteronMock: { failNext(m: string): void } }
      ).__barteronMock.failNext(m),
    method
  )

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/** A new offer with every step filled, as the form keeps it on the device. */
async function readyDraft(page: Page, caption: string, extra: Record<string, unknown> = {}) {
  await page.addInitScript(
    ({ me, draft, extra }) =>
      localStorage.setItem(
        `${me}_offer_draft`,
        JSON.stringify({ ...draft, ...extra, updatedAt: Date.now() })
      ),
    {
      me: ME,
      extra,
      draft: {
        v: 1,
        hash: null,
        baseTxHash: null,
        caption,
        description: 'Почти новый, с чехлом.',
        tag: 58069,
        condition: 'new',
        photos: [{ id: 'p1', url: PIXEL, status: 'ready', bytes: 68 }],
        video: '',
        exchange: 'own',
        tags: [17],
        price: '120',
        currency: 'PKOIN',
        fixCurrency: false,
        geohash: 'ucfv0n1h4s3k',
        selfPickup: { on: true, info: '' },
        directDelivery: { on: false, info: '' },
        pickupPoints: { on: false, ids: [] },
      },
    }
  )
}

/** Pictures made in the page: PNG files for the photo input. */
async function photos(page: Page, count: number) {
  const data = await page.evaluate(
    (n) =>
      Array.from({ length: n }, (_, i) => {
        const c = document.createElement('canvas')
        c.width = 320
        c.height = 240
        const g = c.getContext('2d')!
        g.fillStyle = `hsl(${(i * 47) % 360} 60% 60%)`
        g.fillRect(0, 0, 320, 240)
        return c.toDataURL('image/png').split(',')[1]!
      }),
    count
  )
  return data.map((b64, i) => ({
    name: `photo${i}.png`,
    mimeType: 'image/png',
    buffer: Buffer.from(b64, 'base64'),
  }))
}

/** A tap in the middle of the map; the locator scrolls it out from under the top bar. */
async function clickMap(page: Page) {
  const map = page.getByTestId('create-map')
  // Leaflet comes in its own chunk: on a cold dev server a tap before it is there is lost.
  await expect(map).toHaveClass(/leaflet-container/)
  await map.click()
  await expect(page.getByTestId('create-place-name')).toBeVisible()
}

// The map opens on the region of the time zone; the demo pickup points are in Moscow.
test.use({ timezoneId: 'Europe/Moscow' })

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

test('new offer: five steps, then the transaction the old app would write', async ({ page }) => {
  await page.goto('/barter/create')
  await expect(page.getByTestId('create')).toBeVisible()

  // «Далее» with nothing typed shows what is missing, and stays.
  await page.getByTestId('create-next').click()
  await expect(page.getByText('Укажите название')).toBeVisible()
  await page.getByTestId('create-caption').fill('Планшет 10", 64 ГБ, с чехлом')
  // The category is suggested by the title.
  await page.getByTestId('create-category-58069').click()
  await page.getByTestId('create-description').fill('Почти новый, в комплекте зарядка.')
  await page.getByTestId('create-next').click()

  await page.getByTestId('create-photo-input').setInputFiles(await photos(page, 2))
  await expect(page.getByTestId('create-photo-ready')).toHaveCount(2)
  await expect(page.getByTestId('create-photo-count')).toContainText('2 из 10')
  await page.getByTestId('create-next').click()

  await page.getByTestId('create-quick-17').click()
  // ru-RU: the price is typed in roubles and kept in them.
  await page.getByTestId('create-price').fill('12 400')
  await expect(page.getByTestId('create-equivalent')).toContainText('PKOIN')
  await page.getByTestId('create-fee-inHalf').click()
  await page.getByTestId('create-next').click()

  await page.getByTestId('create-next').click()
  await expect(page.getByText('Укажите место на карте')).toBeVisible()
  // Outside Bastyon the address search does not run, and says so.
  await page.getByTestId('create-place-search').fill('Москва')
  await expect(page.getByTestId('create-place-note')).toHaveText(/работает внутри Bastyon/)
  await page.getByTestId('create-place-search').fill('')
  await clickMap(page)
  await page.getByTestId('create-self-pickup').click()
  await page.getByTestId('create-next').click()

  await expect(page.getByTestId('create-review-price')).toContainText('фиксирована в RUB')
  await expect(page.getByTestId('create-review-safe')).toContainText('пополам')
  await expect(page.getByTestId('create-issues')).toHaveCount(0)
  await page.getByTestId('create-publish').click()
  await expect(page.getByTestId('create-panel')).toContainText('Данные отправлены на ноду')
  // Replies will come: the old app asked to set up notifications here.
  await expect(page.getByTestId('notify-reminder')).toBeVisible()

  const [sent] = await callsOf(page, 'barteron.offer')
  const payload = sent!.args[0] as Record<string, unknown>
  expect(payload).toMatchObject({
    address: ME,
    hash: null,
    language: 'ru-RU',
    caption: 'Планшет 10", 64 ГБ, с чехлом',
    tag: 58069,
    tags: [17],
    condition: 'new',
    video: '',
    currencyPrice: { currency: 'RUB', price: 12400 },
    safeDeal: { validatorFeeVariant: 'inHalf' },
    videoSettings: { order: 'first' },
    delivery: {
      deliveryOptions: {
        selfPickup: { isEnabled: true, additionalInfo: '' },
        directDelivery: { isEnabled: false },
        pickupPoints: { isEnabled: false, ids: [] },
      },
    },
    published: 'published',
  })
  expect(payload.images).toHaveLength(2)
  expect(String(payload.geohash)).toHaveLength(12)
  expect(payload.price).toBeGreaterThan(0)

  await expect(page.getByTestId('create-panel')).toContainText('Объявление в сети', {
    timeout: 10_000,
  })
  await page.getByTestId('create-open-offer').click()
  await expect(page.getByTestId('item-page')).toHaveAttribute('data-kind', 'own')

  // Published: the draft is gone.
  await page.goto('/barter/create')
  await expect(page.getByTestId('create-caption')).toHaveValue('')
})

test('the draft stays on the device; «Начать заново» clears it', async ({ page }) => {
  await page.goto('/barter/create')
  await page.getByTestId('create-caption').fill('Горный велосипед')
  await page.waitForTimeout(700)
  await page.reload()
  await expect(page.getByTestId('create-caption')).toHaveValue('Горный велосипед')
  await expect(page.getByTestId('create-restored')).toContainText('Продолжаем черновик')

  // The full page of the draft, as buyers will see it, and back to the form.
  await page.goto('/barter/draft')
  await expect(page.getByTestId('draft-preview')).toBeVisible()
  await expect(page.getByTestId('item-title')).toHaveText('Горный велосипед')
  await expect(page.getByTestId('item-favorite')).toHaveCount(0)
  await page.getByRole('link', { name: 'Вернуться к редактированию' }).click()
  // Back to the review, where the full page was opened from.
  await expect(page.getByRole('heading', { name: 'Проверьте объявление' })).toBeVisible()

  await page.getByTestId('create-start-over').click()
  await page.getByTestId('confirm-action').click()
  await expect(page.getByTestId('create-caption')).toHaveValue('')
  await page.reload()
  await expect(page.getByTestId('create-caption')).toHaveValue('')
})

test('refused, then «Повторить публикацию»: the progress shows, no failed twin in the cabinet', async ({
  page,
}) => {
  await readyDraft(page, 'Планшет для повтора')
  await page.goto('/barter/create?step=5')
  await expect(page.getByTestId('create-publish')).toBeEnabled()
  await expect(page.getByTestId('create-issues')).toHaveCount(0)
  await failNext(page, 'barteron.offer')
  await page.getByTestId('create-publish').click()
  await page.getByRole('button', { name: 'Повторить публикацию' }).click()
  await expect(page.getByTestId('create-panel')).toContainText('Данные отправлены на ноду')
  await page.getByTestId('create-open-offer').click()
  await expect(page.getByTestId('item-page')).toBeVisible()

  await spaGo(page, `/profile/${ME}#ads`)
  const rows = page.getByTestId('my-offer').filter({ hasText: 'Планшет для повтора' })
  await expect(rows).toHaveCount(1)
  await expect(rows.getByTestId('my-offer-status')).not.toContainText('Не опубликовано')
  expect(await callsOf(page, 'barteron.offer')).toHaveLength(2)
})

test('refused, then published from the cabinet: the form does not offer it as a draft again', async ({
  page,
}) => {
  await readyDraft(page, 'Планшет из кабинета')
  await page.goto('/barter/create?step=5')
  await expect(page.getByTestId('create-publish')).toBeEnabled()
  await expect(page.getByTestId('create-issues')).toHaveCount(0)
  await failNext(page, 'barteron.offer')
  await page.getByTestId('create-publish').click()
  await expect(page.getByRole('button', { name: 'Повторить публикацию' })).toBeVisible()

  await spaGo(page, `/profile/${ME}#ads`)
  const row = page.getByTestId('my-offer').filter({ hasText: 'Планшет из кабинета' })
  await expect(row.getByTestId('my-offer-status')).toContainText('Не опубликовано')
  const draftKept = () =>
    page.evaluate((me) => localStorage.getItem(`${me}_offer_draft`) !== null, ME)
  // Refused again: the draft stays.
  await failNext(page, 'barteron.offer')
  await row.getByRole('button', { name: 'Повторить' }).click()
  await expect.poll(() => callsOf(page, 'barteron.offer').then((c) => c.length)).toBe(2)
  await expect(row.getByTestId('my-offer-status')).toContainText('Не опубликовано')
  expect(await draftKept()).toBe(true)
  await row.getByRole('button', { name: 'Повторить' }).click()
  // Once the host has taken it: the draft goes with that answer.
  await expect(row.getByTestId('my-offer-status')).toContainText('В сети', { timeout: 10_000 })

  await spaGo(page, '/barter/create')
  await expect(page.getByTestId('create-caption')).toHaveValue('')
  await expect(page.getByTestId('create-restored')).toHaveCount(0)
})

for (const currency of ['PKOIN', 'EUR']) {
  test(`Serbian «12.400 ${currency}»: the equivalent reads it as twelve thousand while typing`, async ({
    page,
  }) => {
    await page.addInitScript((me) => localStorage.setItem(`${me}_locale`, '"sr-RS"'), ME)
    await readyDraft(page, 'Bicikl', { currency, fixCurrency: currency !== 'PKOIN' })
    await page.goto('/barter/create?step=3')
    const equivalent = page.getByTestId('create-equivalent')
    await page.getByTestId('create-price').fill('12.400')
    await expect(equivalent).toBeVisible()
    const typing = await equivalent.innerText()
    await page.getByTestId('create-price').blur()
    await expect(page.getByTestId('create-price')).toHaveValue('12400')
    await expect(equivalent).toHaveText(typing)
  })
}

test('Serbian «12.400» is twelve thousand: the field shows it so and the offer says it', async ({
  page,
}) => {
  await page.addInitScript((me) => localStorage.setItem(`${me}_locale`, '"sr-RS"'), ME)
  await readyDraft(page, 'Bicikl')
  await page.goto('/barter/create?step=3')
  await page.getByTestId('create-price').fill('12.400')
  await page.getByTestId('create-price').blur()
  await expect(page.getByTestId('create-price')).toHaveValue('12400')
  await spaGo(page, '/barter/create?step=5')
  await page.getByTestId('create-publish').click()
  await expect(page.getByTestId('create-panel')).toBeVisible()
  const [sent] = await callsOf(page, 'barteron.offer')
  // Hundredths of PKOIN.
  expect((sent!.args[0] as { price: number }).price).toBe(1_240_000)
})

test('photos: a failed upload retries; no more than ten', async ({ page }) => {
  await page.goto('/barter/create?step=2')
  // The form shows once the mock host is connected.
  await expect(page.getByTestId('create-photo-add')).toBeAttached()
  await page.evaluate(() =>
    (window as { __barteronMock?: { failNext(m: string): void } }).__barteronMock!.failNext(
      'images.upload'
    )
  )
  await page.getByTestId('create-photo-input').setInputFiles(await photos(page, 1))
  await expect(page.getByTestId('create-photo-failed')).toBeVisible()
  await page.getByTestId('create-next').click()
  await expect(page.getByText('Не загрузились фото №1')).toBeVisible()
  await page.getByTestId('create-photo-retry').click()
  await expect(page.getByTestId('create-photo-ready')).toHaveCount(1)

  await page.getByTestId('create-photo-input').setInputFiles(await photos(page, 11))
  await expect(page.getByTestId('create-photo-limit')).toContainText('только 10 из 12')
  await expect(page.locator('[data-photo-index]')).toHaveCount(10)
})

test('photos: a picture the browser cannot open is named, not left to «Повторить»', async ({
  page,
}) => {
  await page.goto('/barter/create?step=2')
  const input = page.getByTestId('create-photo-input')
  await expect(page.getByTestId('create-photo-add')).toBeAttached()
  // Asked for these, iOS turns HEIC into JPEG itself, as for the old form.
  await expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
  // Dropped or picked anyway: Chromium cannot open HEIC.
  await input.setInputFiles([
    {
      name: 'IMG_0001.HEIC',
      mimeType: 'image/heic',
      buffer: Buffer.from('ftypheic-not-a-picture'),
    },
    ...(await photos(page, 1)),
  ])
  await expect(page.getByTestId('create-photo-ready')).toHaveCount(1)
  await expect(page.getByTestId('create-photo-failed')).toHaveCount(0)
  await expect(page.getByTestId('create-photo-unreadable')).toContainText('IMG_0001.HEIC')
  // Nothing in the way of the next step.
  await page.getByTestId('create-next').click()
  await expect(page).toHaveURL(/step=3/)
})

test('video: the host not answering about it is not «обработка завершилась ошибкой»', async ({
  page,
}) => {
  await readyDraft(page, 'Планшет с видео', { video: 'peertube://mock.video/unreachable' })
  await page.goto('/barter/create?step=2')
  const tile = page.getByTestId('create-video-unchecked')
  await expect(tile).toContainText('Не удалось проверить видео')
  await expect(page.getByText('Обработка видео завершилась ошибкой')).toHaveCount(0)
  await page.getByTestId('create-next').click()
  await expect(page.getByText('Не удалось проверить видео. Проверьте ещё раз')).toBeVisible()
  await tile.getByRole('button', { name: 'Проверить ещё раз' }).click()
  await expect(tile).toContainText('Не удалось проверить видео')
})

test('video: Bastyon’s upload window, processing holds publishing', async ({ page }) => {
  await page.goto('/barter/create?step=2')
  await page.getByTestId('create-video-add').click()
  await expect(page.getByTestId('create-video-processing')).toBeVisible()
  await expect(page.getByText('Дождитесь окончания обработки')).toBeVisible()
  // The mock processes a video in six seconds.
  await expect(page.getByTestId('create-video-ready')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('create-video-remove').click()
  await page.getByTestId('confirm-action').click()
  await expect(page.getByTestId('create-video-add')).toBeVisible()
  // Uploaded here: it leaves Bastyon's storage too.
  expect(await callsOf(page, 'videos.remove')).toHaveLength(1)
})

test('the browser’s back and forward walk the steps; back out of an edit asks first', async ({
  page,
}) => {
  // Opened from inside the app, so there is a page of it to go back to.
  await page.goto('/')
  await expect(page.getByTestId('home')).toBeVisible()
  await spaGo(page, `/barter/edit/${LAPTOP}`)
  await expect(page.getByTestId('create-caption')).toHaveValue('Ноутбук 14", 16 ГБ')
  await page.getByTestId('create-caption').fill('Ноутбук 14", 16 ГБ, торг')
  await page.getByTestId('create-next').click()
  await expect(page).toHaveURL(/step=2/)
  await page.goBack()
  await expect(page.getByTestId('create-caption')).toHaveValue('Ноутбук 14", 16 ГБ, торг')
  await page.goForward()
  await expect(page).toHaveURL(/step=2/)
  await page.goBack()
  await expect(page).not.toHaveURL(/step=/)

  // One more step back leaves the edit: the changes are not in the offer yet.
  await page.goBack()
  await expect(page.getByText('Выйти из редактирования?')).toBeVisible()
  await page.getByTestId('confirm-cancel').click()
  await expect(page).toHaveURL(new RegExp(`/barter/edit/${LAPTOP}`))
  await expect(page.getByTestId('create-caption')).toHaveValue('Ноутбук 14", 16 ГБ, торг')

  // A link to the middle of the form opens that step.
  await spaGo(page, `/barter/edit/${LAPTOP}?step=3`)
  await expect(page.getByTestId('create-quick-17')).toBeVisible()
})

test('editing my offer keeps its id; leaving with changes asks first', async ({ page }) => {
  await page.goto(`/barter/edit/${LAPTOP}`)
  await expect(page.getByTestId('create-caption')).toHaveValue('Ноутбук 14", 16 ГБ')
  await page.getByTestId('create-caption').fill('Ноутбук 14", 16 ГБ, торг')

  await page.getByTestId(isPhone(page) ? 'create-top-back' : 'create-exit').click()
  await expect(page.getByText('Выйти из редактирования?')).toBeVisible()
  await page.getByTestId('confirm-cancel').click()

  for (let i = 0; i < 4; i++) await page.getByTestId('create-next').click()
  await expect(page.getByTestId('create-publish')).toHaveText('Сохранить изменения')
  await page.getByTestId('create-publish').click()
  await expect(page.getByTestId('create-panel')).toContainText('Сохраняем изменения')
  const [sent] = await callsOf(page, 'barteron.offer')
  expect(sent!.args[0]).toMatchObject({
    hash: LAPTOP,
    caption: 'Ноутбук 14", 16 ГБ, торг',
    tag: 58068,
    tags: [1006],
    price: 520000,
    published: 'published',
  })
})

test('pickup point: its own steps and the terms as the old app writes them', async ({ page }) => {
  await page.goto('/barter/create')
  await page.getByTestId('create-caption').fill('ПВЗ у дома')
  await page.getByTestId('create-pick-category').click()
  await page.getByTestId('category-browser').locator('input').fill('Пункт выдачи')
  await page.getByRole('button', { name: /Пункт выдачи заказов/ }).click()
  await expect(page.getByText('Вы выбрали категорию «Пункт выдачи заказов»')).toBeVisible()
  await page.getByTestId('create-description').fill('Рядом с метро, принимаем посылки до 5 кг.')
  await page.getByTestId('create-next').click()

  await page.getByTestId('create-photo-input').setInputFiles(await photos(page, 1))
  await expect(page.getByTestId('create-photo-ready')).toHaveCount(1)
  // No video for a pickup point.
  await expect(page.getByTestId('create-video-add')).toHaveCount(0)
  await page.getByTestId('create-next').click()

  await expect(page.getByRole('heading', { name: 'Условия пункта выдачи' })).toBeVisible()
  await page.getByTestId('create-next').click()
  await expect(page.getByText('Опишите финансовые условия')).toBeVisible()
  await page.getByTestId('create-point-cost').fill('60')
  await page.getByTestId('create-point-terms').fill('60 PKOIN за посылку до 5 кг')
  await page.getByTestId('create-point-address').fill('ул. Марксистская, 3')
  await page.getByTestId('create-point-route').fill('Арка у аптеки, вторая дверь')
  await page.getByTestId('create-next').click()

  await clickMap(page)
  await page.getByTestId('create-next').click()
  await expect(page.getByTestId('create-review-schedule')).toContainText('5 рабочих дней')
  await page.getByTestId('create-publish').click()
  await expect(page.getByTestId('create-panel')).toBeVisible()

  const [sent] = await callsOf(page, 'barteron.offer')
  const payload = sent!.args[0] as { delivery: { pickupPoint: Record<string, unknown> } } & Record<
    string,
    unknown
  >
  expect(payload).toMatchObject({ tag: 97, tags: [], price: 6000, metaData: {} })
  expect(payload.delivery.pickupPoint).toMatchObject({
    financialTerms: '60 PKOIN за посылку до 5 кг',
    address: 'ул. Марксистская, 3',
    route: 'Арка у аптеки, вторая дверь',
    workSchedule: {
      weekDays: {
        day1: { startTime: '10:00', finishTime: '20:00' },
        day5: { startTime: '10:00', finishTime: '20:00' },
      },
    },
  })
  expect(payload.delivery.pickupPoint.workSchedule).not.toHaveProperty('weekDays.day6')
})

test('choosing pickup points near the offer locks its point', async ({ page }) => {
  await page.goto('/barter/create?step=4')
  await page.getByTestId('create-pickup-points').click()
  await expect(page.getByText('Сначала укажите место на карте')).toBeVisible()
  await clickMap(page)
  await page.getByTestId('create-pickup-points').click()
  await page.getByTestId('create-find-pickup').click()
  const search = page.getByTestId('create-pickup-search')
  await expect(search).toContainText('ПВЗ на Таганской')
  await search.getByRole('button', { name: 'Выбрать' }).first().click()
  await page.getByTestId('create-pickup-done').click()
  await expect(page.getByTestId('create-pickup-chosen')).toHaveCount(1)
  await expect(page.getByText('точка на карте закреплена')).toBeVisible()
})
