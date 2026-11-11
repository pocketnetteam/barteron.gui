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
  await page.getByTestId('create-map').click()
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
