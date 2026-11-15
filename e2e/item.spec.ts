import { expect, test, type Page } from '@playwright/test'

/**
 * Stage 4 on the mock network: someone else's offer, my own, a pickup point,
 * the dialogs and what goes to the host (chat, transactions). Writes reach
 * only the in-memory network; nothing leaves the machine.
 */
const ME = 'PMockUser1111111111111111111111111'
const ILYA = 'PDemoIyaPetrov'.padEnd(34, '1')
const DMITRY = 'PDemoDmitryK'.padEnd(34, '1')
/** Same as `demoTxid` in src/sdk/mock-data.ts. */
const id = (label: string) =>
  Array.from(label)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(64, 'a')
    .slice(0, 64)
const TABLET = id('tablet-ilya')
const LAPTOP = id('laptop-mine')
const POINT = id('pvz-taganka')
const link = (hash: string) =>
  `bastyon://application?id=barteron.pocketnet.app&p=${encodeURIComponent(`barter/${hash}`)}`

interface Call {
  method: string
  args: unknown[]
}
const calls = (page: Page) =>
  page.evaluate(
    () => (window as { __barteronMock?: { calls: Call[] } }).__barteronMock?.calls ?? []
  )
const callsOf = async (page: Page, method: string) =>
  (await calls(page)).filter((c) => c.method === method)

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768
let outside: string[] = []

test.beforeEach(async ({ page }, info) => {
  outside = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http') && url.hostname !== 'localhost') outside.push(url.href)
  })
  // The renewal reminder has its own test; elsewhere it would cover the page.
  if (!info.title.startsWith('renewal')) {
    await page.addInitScript(
      (me) => localStorage.setItem(`${me}_autorenew_snooze`, String(Date.now())),
      ME
    )
  }
})

test.afterEach(() => {
  expect(outside).toEqual([])
})

test("someone else's offer: gallery, «Меняю на» with my fitting laptop, reviews", async ({
  page,
}) => {
  await page.goto(`/barter/${TABLET}`)
  const item = page.getByTestId('item-page')
  await expect(item).toHaveAttribute('data-kind', 'other')
  await expect(item).toContainText('Планшет 10", 64 ГБ, с чехлом-клавиатурой')
  await expect(item).toContainText('Ноутбуки')
  await expect(item).toContainText('Покеткоины')
  await expect(item).toContainText('Ваш «Ноутбук 14", 16 ГБ» подходит для обмена')
  await expect(item).toContainText('Покупал через безопасную сделку')
  if (!isPhone(page)) {
    await expect(item).toContainText('1 / 6')
    await expect(item).toContainText('Можно купить через безопасную сделку.')
  }
  // Seen offers go to the old app's list.
  const viewed = await page.evaluate((me) => localStorage.getItem(`${me}_viewed`), ME)
  expect(JSON.parse(viewed ?? '[]')).toContain(TABLET)
})

test('propose an exchange: the chat gets my offer, theirs and «Предлагаю обмен»', async ({
  page,
}) => {
  await page.goto(`/barter/${TABLET}`)
  if (isPhone(page)) await page.getByRole('button', { name: 'Обменять' }).click()
  else await page.getByTestId('item-exchange').click()
  const dialog = page.getByRole('dialog', { name: 'Что предложить взамен?' })
  await expect(dialog).toContainText('Ноутбук 14", 16 ГБ')
  await expect(dialog).toContainText('Подходит')
  // Withdrawn and expired offers are not offered.
  const list = dialog.getByRole('radiogroup')
  await expect(list).not.toContainText('Планшет 10"')
  await expect(list).not.toContainText('Колонка портативная')
  await dialog.getByTestId('propose-send').click()
  await expect(dialog).toBeHidden()

  const [room] = await callsOf(page, 'chat.getOrCreateRoom')
  expect(room?.args[0]).toEqual({ users: [ILYA], parameters: { name: 'Ноутбук 14", 16 ГБ' } })
  const [sent] = await callsOf(page, 'chat.send')
  expect(sent?.args[0]).toEqual({
    roomid: 'mock-room',
    content: { messages: [link(LAPTOP), link(TABLET), 'Предлагаю обмен'], images: [] },
  })
})

test('buy: first a way to get it, then the chat gets that way', async ({ page }) => {
  await page.goto(`/barter/${TABLET}`)
  const buy = () =>
    isPhone(page)
      ? page.getByRole('button', { name: 'Купить', exact: true }).click()
      : page.getByTestId('item-buy').click()

  await buy()
  // Nothing picked yet: the delivery block asks for a choice, no chat.
  await expect(page.locator('#item-delivery')).toHaveClass(/idl--attention/)
  expect(await callsOf(page, 'chat.send')).toHaveLength(0)

  await page.locator('#item-delivery').getByText('Самовывоз', { exact: true }).click()
  await buy()
  // The seller takes PKOIN: first «how to buy» (the safe deal: e2e/safe-deal.spec.ts).
  const dialog = page.getByRole('dialog', { name: 'Как купить?' })
  await expect(dialog).toContainText('Через безопасную сделку')
  await dialog.getByRole('button', { name: 'Дальше' }).click()
  const preview = page.getByRole('dialog', { name: 'Написать продавцу о покупке' })
  await expect(preview).toContainText('Вариант получения товара: "Самовывоз"')
  await preview.getByTestId('buy-open-chat').click()
  await expect(preview).toBeHidden()

  const [sent] = await callsOf(page, 'chat.send')
  expect(sent?.args[0]).toMatchObject({
    content: { messages: [link(TABLET), 'Вариант получения товара: "Самовывоз"'] },
  })
})

test('a pickup point: the cheapest first, its owner joins the chat', async ({ page }) => {
  test.skip(isPhone(page), 'the phone picks a point on its own screen')
  await page.goto(`/barter/${TABLET}`)
  const delivery = page.locator('#item-delivery')
  await delivery.getByText('Пункт выдачи', { exact: true }).click()
  await expect(delivery.locator('.idl__point').first()).toContainText('ПВЗ на Таганской')
  await expect(delivery.locator('.idl__point')).toHaveCount(3)
  await expect(page.getByTestId('item-page')).toContainText('Выбран ПВЗ на Таганской · 60 PKOIN')
  await page.getByTestId('item-buy').click()
  const preview = page.getByRole('dialog', { name: 'Написать продавцу о покупке' })
  await preview.getByTestId('buy-open-chat').click()
  await expect(preview).toBeHidden()

  const [room] = await callsOf(page, 'chat.getOrCreateRoom')
  expect((room?.args[0] as { users: string[] }).users).toEqual([ILYA, DMITRY])
  const [sent] = await callsOf(page, 'chat.send')
  expect(sent?.args[0]).toMatchObject({
    content: {
      messages: [link(TABLET), link(POINT), 'Вариант получения товара: "Пункт выдачи заказов"'],
    },
  })
})

test('a review with stars becomes a score and a comment; mine shows as publishing', async ({
  page,
}) => {
  await page.goto(`/barter/${TABLET}`)
  const form = page.getByTestId('review-form').filter({ visible: true })
  await form.getByRole('radio', { name: '5 звёзд' }).click()
  await form.getByRole('textbox').fill('Отличный планшет')
  await form.getByTestId('review-send').click()
  // A score cannot be changed later: asked first (s8-confirm).
  await expect(page.getByRole('dialog')).toContainText('Отправить оценку «5»?')
  await page.getByTestId('confirm-action').click()
  await expect(page.getByTestId('item-page')).toContainText('Отзыв публикуется')
  await expect.poll(async () => (await callsOf(page, 'barteron.vote')).length).toBe(1)
  const [vote] = await callsOf(page, 'barteron.vote')
  expect(vote?.args[0]).toEqual({ share: TABLET, vsaddress: ILYA, value: 5 })
  const [comment] = await callsOf(page, 'barteron.comment')
  expect(comment?.args[0]).toMatchObject({
    postid: TABLET,
    msgparsed: { message: 'Отличный планшет', info: '5' },
  })
})

test('a low score under 100 reputation: refused, no transaction', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as { __barteronMockSetup?: unknown }).__barteronMockSetup = { reputation: 5 }
  })
  await page.goto(`/barter/${TABLET}`)
  const form = page.getByTestId('review-form').filter({ visible: true })
  await form.getByRole('radio', { name: '2 звезды' }).click()
  await expect(form).toContainText('Ваш стаж в Bastyon пока не позволяет')
  await expect(form.getByTestId('review-send')).toBeDisabled()
})

test('my offer: withdraw it, watch the status, publish again', async ({ page }) => {
  await page.goto(`/barter/${LAPTOP}`)
  await expect(page.getByTestId('item-page')).toHaveAttribute('data-kind', 'own')
  if (isPhone(page)) await page.getByRole('button', { name: 'Снять с публикации' }).click()
  else await page.getByTestId('own-withdraw').click()
  await page.getByTestId('confirm-action').click()
  await expect(page.getByTestId('own-notice')).toContainText('Снимаем с публикации')
  // The mock makes a block in four seconds.
  await expect(page.getByTestId('own-notice')).toContainText('Не показывается в поиске', {
    timeout: 15_000,
  })
  const [offer] = await callsOf(page, 'barteron.offer')
  expect(offer?.args[0]).toMatchObject({ hash: LAPTOP, published: 'withdrawed' })

  await page.getByTestId('own-renew').filter({ visible: true }).click()
  await page.getByTestId('confirm-action').click()
  await expect(page.getByTestId('own-notice')).toContainText('Публикуется в сети')
})

test('my offer: a refused withdrawal says why in words and can be retried', async ({ page }) => {
  await page.goto(`/barter/${LAPTOP}`)
  await expect(page.getByTestId('item-page')).toHaveAttribute('data-kind', 'own')
  await page.evaluate(() =>
    (window as { __barteronMock?: { failNext(m: string): void } }).__barteronMock!.failNext(
      'barteron.offer'
    )
  )
  if (isPhone(page)) await page.getByRole('button', { name: 'Снять с публикации' }).click()
  else await page.getByTestId('own-withdraw').click()
  await page.getByTestId('confirm-action').click()
  // The node's code -26 in the old app's words, not «-26».
  const notice = page.getByTestId('own-notice')
  await expect(notice).toContainText('Минимальная плата за ретрансляцию не достигнута')
  await expect(notice).not.toContainText('-26')
  await page.getByTestId('own-retry').filter({ visible: true }).click()
  await expect(notice).toContainText('Снимаем с публикации')
  const offers = await callsOf(page, 'barteron.offer')
  expect(offers.map((c) => (c.args[0] as { published: string }).published)).toEqual([
    'withdrawed',
    'withdrawed',
  ])
})

test('my offer as buyers see it: their buttons, nothing to press', async ({ page }) => {
  test.skip(isPhone(page), 'same page as someone else’s offer')
  await page.goto(`/barter/${LAPTOP}?view=buyer`)
  const item = page.getByTestId('item-page')
  await expect(item).toHaveAttribute('data-kind', 'other')
  await expect(item).toContainText('Так ваше объявление видят покупатели')
  await expect(page.getByTestId('item-exchange')).toBeDisabled()
})

test('a pickup point page: hours, terms, chat with its owner', async ({ page }) => {
  await page.goto(`/barter/${POINT}`)
  const item = page.getByTestId('item-page')
  await expect(item).toHaveAttribute('data-kind', 'pickup')
  await expect(item).toContainText('График работы')
  await expect(item).toContainText('Финансовые условия')
  await expect(item).toContainText('Марксистская')
  await page
    .getByRole('button', { name: /Чат с владельцем ПВЗ/ })
    .filter({ visible: true })
    .click()
  await expect.poll(async () => (await callsOf(page, 'chat.send')).length).toBe(1)
  const [room] = await callsOf(page, 'chat.getOrCreateRoom')
  expect((room?.args[0] as { users: string[] }).users).toEqual([DMITRY])
})

test('an unknown offer: «not found» with a way back', async ({ page }) => {
  await page.goto(`/barter/${'f'.repeat(64)}`)
  await expect(page.getByTestId('item-missing')).toContainText('Объявление не найдено')
  await expect(page.getByRole('link', { name: 'На главную' })).toBeVisible()
  // An id that cannot be an offer is not even asked for: «not found», not a skeleton forever.
  await page.goto('/barter/not-an-offer%3Cb%3E')
  await expect(page.getByTestId('item-missing')).toContainText('Объявление не найдено')
})

test('report and share go to the host', async ({ page }) => {
  test.skip(isPhone(page), 'the same calls from the phone footer')
  await page.goto(`/barter/${TABLET}`)
  await page.getByTestId('item-complain').click()
  const [complaint] = await callsOf(page, 'helpers.complain')
  expect(complaint?.args[0]).toMatchObject({ entityTxid: TABLET, entityType: 'offer' })
  await page.getByRole('button', { name: 'Поделиться в Bastyon' }).click()
  const [share] = await callsOf(page, 'helpers.shareOnBastyon')
  expect(share?.args[0]).toMatchObject({
    path: `barter/${TABLET}`,
    sharing: { text: { body: 'Планшет 10", 64 ГБ, с чехлом-клавиатурой' } },
  })
})

test('renewal reminder: my offers whose year runs out, renewed with one confirmation', async ({
  page,
}) => {
  await page.goto('/')
  const prompt = page.getByRole('dialog', { name: /Продлить 2 объявления/ })
  await expect(prompt).toContainText('Наушники накладные')
  await expect(prompt).toContainText('Колонка портативная')
  await page.getByTestId('autorenew-confirm').click()
  await expect(prompt).toBeHidden()
  await expect.poll(async () => (await callsOf(page, 'barteron.offer')).length).toBe(2)
  // Not again on the next page: the mock starts over (both offers run out
  // again), the device remembers they were asked about.
  await page.goto(`/barter/${TABLET}`)
  await expect(page.locator('[data-testid="item-page"][data-kind="other"]')).toBeVisible()
  // My offers have come: the reminder would show now if it were to.
  await expect
    .poll(async () =>
      (await callsOf(page, 'rpc')).some((c) => c.args[0] === 'getbarteronoffersbyaddress')
    )
    .toBe(true)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))))
  expect(await page.getByRole('dialog', { name: /Продлить/ }).count()).toBe(0)
})

test('strings from the network: long words, invisible and right-to-left characters', async ({
  page,
}) => {
  const word = 'Сверхдлинноеназваниебезпробелов'.repeat(6)
  await page.addInitScript(
    (texts) => {
      ;(window as { __barteronMockSetup?: unknown }).__barteronMockSetup = { texts }
    },
    {
      // A right-to-left override and a zero-width space would turn the name around
      // and make it look like someone else's.
      name: '\u202Eanna\u200B' + 'Очень'.repeat(12),
      caption: `Планшет ${word}`,
      description: `https://example.com/${'a'.repeat(300)} javascript:alert(1) ${word}`,
    }
  )
  const noSideScroll = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

  await page.goto(`/barter/${TABLET}`)
  const item = page.getByTestId('item-page')
  await expect(item).toContainText('Планшет Сверхдлинное')
  await expect(item).toContainText('anna' + 'Очень'.repeat(12))
  expect(
    await item.evaluate((el) => /[\u202A-\u202E\u2066-\u2069\u200B]/.test(el.textContent ?? ''))
  ).toBe(false)
  // The address in the text is not a link.
  await expect(item.locator('a[href^="javascript:"], a[href*="example.com"]')).toHaveCount(0)
  expect(await noSideScroll()).toBe(true)

  await page.goto(`/profile/${ILYA}`)
  await expect(page.getByText('Планшет Сверхдлинное').first()).toBeVisible()
  expect(await noSideScroll()).toBe(true)

  await page.goto('/')
  await expect(page.getByText('Планшет Сверхдлинное').first()).toBeVisible()
  expect(await noSideScroll()).toBe(true)
})
