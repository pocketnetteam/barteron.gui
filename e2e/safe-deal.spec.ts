import { createHash } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'

/**
 * Stage 8 on the mock network: safe deals. The mock user has four deals on
 * the device (sdk/mock-data.ts `demoDeals`): buying Илья's tablet with Мария
 * as the guarantor (nothing paid), holding Анна's payment for Илья's bike
 * (my decision), selling my laptop (Илья's transfer to me is in a block) and
 * a smartphone bought long ago. Transfers go to the mock wallet and chain;
 * nothing leaves the machine.
 */
const ME = 'PMockUser1111111111111111111111111'
const addr = (name: string) => `PDemo${name}`.padEnd(34, '1')
const ILYA = addr('IyaPetrov')
const MARIA = addr('MariaV')
const ANNA = addr('AnnaKovaeva')
/** Same as `demoTxid` in src/sdk/mock-data.ts. */
const txid = (label: string) =>
  Array.from(label)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(64, 'a')
    .slice(0, 64)
const TABLET = txid('tablet-ilya')

/**
 * The deal id the old app built (safeDealUtils.js `IdHelper`), with Node's
 * own MD5: the app's implementation is checked against it.
 */
const dealId = (
  random: string,
  t: { offer: string; buyer: string; validator: string; fee: string }
) =>
  `${random}${createHash('md5')
    .update(`${random}${t.offer}${t.buyer}${t.validator}${t.fee}1`)
    .digest('hex')
    .slice(0, 8)}01`
const deal = (offer: string, buyer: string, validator: string, random: string) => {
  const terms = { offer: txid(offer), buyer, validator, fee: '2' }
  return { id: dealId(random, terms), ...terms }
}
const BUY_TABLET = deal('tablet-ilya', ME, MARIA, '7ab1e7000000d0a1')
const HOLD_BIKE = deal('bike', ANNA, ME, 'b1ce000000000d0b')
const SELL_LAPTOP = deal('laptop-mine', MARIA, ILYA, '1a9709000000d0c3')
const BOUGHT_PHONE = deal('phone', ME, ILYA, '9407e0000000d0d4')
const page$ = (d: Record<string, string>) => `/barter/safedeal?${new URLSearchParams(d)}`
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

test('buy through a safe deal: a guarantor, the deal chat, then the deal page', async ({
  page,
}) => {
  await page.goto(`/barter/${TABLET}`)
  await page.locator('#item-delivery').getByText('Самовывоз', { exact: true }).click()
  const buy = () =>
    isPhone(page)
      ? page.getByRole('button', { name: 'Купить', exact: true }).click()
      : page.getByTestId('item-buy').click()
  await buy()
  await page.getByTestId('buy-type-safe').click()
  await page.getByTestId('buy-next').click()
  await expect(page.getByTestId('buy-open-deal')).toBeEnabled()
  // Closed and opened again: the guarantors are known now, the first is still chosen.
  const first = page.getByRole('dialog', { name: 'Выберите гаранта' })
  await first.getByRole('button', { name: 'Назад' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Отмена' }).click()
  await buy()
  await page.getByTestId('buy-type-safe').click()
  await page.getByTestId('buy-next').click()
  const dialog = page.getByRole('dialog', { name: 'Выберите гаранта' })
  await expect(dialog.getByTestId('buy-open-deal')).toBeEnabled()
  // Илья sells and I buy: Мария is the only guarantor left.
  await expect(dialog.getByTestId('guarantor-option')).toHaveCount(1)
  await expect(dialog.getByTestId('guarantor-sum')).toContainText(
    '12,5 PKOIN · пополам с продавцом'
  )
  await dialog.getByTestId('buy-open-deal').click()

  await expect(page).toHaveURL(/\/barter\/safedeal\?id=[0-9a-f]{26}&offer=/)
  const query = Object.fromEntries(new URL(page.url()).searchParams)
  expect(query).toMatchObject({ offer: TABLET, buyer: ME, validator: MARIA, fee: '2' })
  // The id is the old app's: the same MD5 over the same terms.
  expect(query.id).toBe(dealId(query.id!.slice(0, 16), query as never))

  const [room] = await callsOf(page, 'chat.getOrCreateRoom')
  expect(room?.args[0]).toEqual({
    users: [ILYA, MARIA],
    parameters: { name: 'Планшет 10", 64 ГБ, с чехлом-клавиатурой' },
  })
  const [sent] = await callsOf(page, 'chat.send')
  expect(sent?.args[0]).toMatchObject({
    content: {
      messages: [
        applink(`barter/${TABLET}`),
        'Вариант получения товара: "Самовывоз"',
        'Вариант покупки: безопасная сделка',
        applink(`barter/safedeal?${new URLSearchParams(query)}`),
      ],
    },
  })

  const dealPage = page.getByTestId('deal-page')
  await expect(dealPage).toHaveAttribute('data-state', 'ready')
  await expect(dealPage).toHaveAttribute('data-role', 'buyer')
  // It is on the device list now, next to the four demo deals.
  const stored = await page.evaluate((me) => localStorage.getItem(`${me}_deals`), ME)
  expect(JSON.parse(stored!).map((d: { id: string }) => d.id)).toContain(query.id)
})

test('the buyer pays the guarantor: the exact amount, the deal id in the message', async ({
  page,
}) => {
  await page.goto(page$(BUY_TABLET))
  const action = page.getByTestId('deal-action')
  await expect(action).toHaveAttribute('data-mode', 'pay')
  await expect(page.getByTestId('deal-calc')).toContainText('1 262,5 PKOIN')
  const pay = page.getByTestId('deal-transfer')
  await expect(pay).toBeDisabled()
  await page.getByTestId('deal-confirm').click()
  await expect(pay).toHaveText('Перевести 1 262,5 PKOIN гаранту')
  await pay.click()
  const confirm = page.getByRole('dialog', { name: 'Перевести оплату гаранту?' })
  await expect(confirm).toContainText('Мария В. · гарант')
  await confirm.getByTestId('transfer-confirm').click()

  await expect(page.getByTestId('deal-sent')).toBeVisible()
  await expect(action).toHaveAttribute('data-mode', 'sent')
  const [payment] = await callsOf(page, 'payment')
  expect(payment?.args[0]).toEqual({
    recievers: [{ address: MARIA, amount: 1262.5 }],
    feemode: 'exclude',
    message: `Safe deal ${BUY_TABLET.id}`,
  })
  // The transaction link goes to the deal chat, without a Telegram notice.
  const sent = await callsOf(page, 'chat.send')
  expect(JSON.stringify(sent.at(-1)?.args[0])).toContain('bastyon://transactionview?stx=')
  // The old app's record of the transfer: «ждём блок» holds in either version.
  const record = await page.evaluate((me) => localStorage.getItem(`${me}_safeDeal`), ME)
  expect(JSON.parse(record!)[BUY_TABLET.id]).toMatchObject({ currentStatus: '1' })

  // In a block four seconds later: the payment is on its way to six confirmations.
  await expect(action).toHaveAttribute('data-mode', 'paying', { timeout: 20_000 })
  await expect(page.getByTestId('deal-transfer')).toHaveCount(0)
})

test('a closed wallet window is not a transfer', async ({ page }) => {
  await page.goto(page$(BUY_TABLET))
  // The mock SDK exists once the page is up.
  await expect(page.getByTestId('deal-action')).toHaveAttribute('data-mode', 'pay')
  await page.evaluate(() =>
    (window as { __barteronMock?: { failNext(m: string): void } }).__barteronMock?.failNext(
      'payment'
    )
  )
  await page.getByTestId('deal-confirm').click()
  await page.getByTestId('deal-transfer').click()
  await page.getByTestId('transfer-confirm').click()
  await expect(page.getByTestId('deal-failure')).toContainText('Вы отменили перевод')
  await expect(page.getByTestId('deal-action')).toHaveAttribute('data-mode', 'pay')
  const record = await page.evaluate((me) => localStorage.getItem(`${me}_safeDeal`), ME)
  expect(record).toBeNull()
})

test('the guarantor decides: pay the seller, or the whole payment back', async ({ page }) => {
  await page.goto(page$(HOLD_BIKE))
  await expect(page.getByTestId('deal-page')).toHaveAttribute('data-role', 'validator')
  await expect(page.getByTestId('deal-action')).toHaveAttribute('data-mode', 'decide')
  await page.getByTestId('deal-confirm').click()
  await expect(page.getByTestId('deal-transfer')).toHaveText('Перевести 3 900 PKOIN продавцу')
  await expect(page.getByTestId('deal-calc')).toContainText('Ваша комиссия: 78 PKOIN')

  await page.getByTestId('deal-verdict').getByRole('radio', { name: 'Нет' }).click()
  await expect(page.getByTestId('deal-transfer')).toHaveText('Вернуть 3 978 PKOIN покупателю')
  await page.getByTestId('deal-transfer').click()
  await page
    .getByRole('dialog', { name: 'Вернуть оплату покупателю?' })
    .getByTestId('transfer-confirm')
    .click()
  await expect(page.getByTestId('deal-sent')).toBeVisible()
  const [payment] = await callsOf(page, 'payment')
  expect(payment?.args[0]).toEqual({
    recievers: [{ address: ANNA, amount: 3978 }],
    feemode: 'include',
    message: `Safe deal ${HOLD_BIKE.id}`,
  })
})

test('a transfer on its way, a finished deal, and no move for the others', async ({ page }) => {
  await page.goto(page$(SELL_LAPTOP))
  await expect(page.getByTestId('deal-page')).toHaveAttribute('data-role', 'seller')
  await expect(page.getByTestId('deal-action')).toHaveAttribute('data-mode', 'transit')
  await expect(page.getByTestId('deal-transfer')).toHaveCount(0)

  await page.goto(page$(BOUGHT_PHONE))
  await expect(page.getByTestId('deal-action')).toHaveAttribute('data-mode', 'result')
  await expect(page.getByTestId('deal-action')).toContainText('Сделка завершена')
  // The buyer rates the purchase right there.
  await expect(page.getByTestId('deal-review')).toBeVisible()
})

test('not my deal, and a link edited by hand', async ({ page }) => {
  await page.goto(page$(deal('road-bike', ANNA, ILYA, '0000000000000abc')))
  await expect(page.getByTestId('deal-page')).toHaveAttribute('data-state', 'noAccess')
  await page.goto(page$({ ...BUY_TABLET, fee: '3' }))
  await expect(page.getByTestId('deal-bad')).toContainText('Номер сделки не совпадает')
  // Made by hand with a fitting id: I buy my own laptop; Илья guarantees the
  // tablet he sells. Nobody is offered to pay.
  for (const link of [
    deal('laptop-mine', ME, ILYA, '00000000000000aa'),
    deal('tablet-ilya', ME, ILYA, '00000000000000bb'),
    deal('tablet-ilya', MARIA, MARIA, '00000000000000cc'),
  ]) {
    await page.goto(page$(link))
    await expect(page.getByTestId('deal-bad')).toContainText('один человек в двух ролях')
    await expect(page.getByTestId('deal-transfer')).toHaveCount(0)
  }
})

test('«Сделки» in the cabinet: active and finished, by role, the move that is mine', async ({
  page,
}) => {
  await page.goto(`/profile/${ME}#deals`)
  const section = page.getByTestId('cabinet-deals')
  await expect(section.getByTestId('deals-tabs')).toContainText(/Активные\s*3/)
  await expect(section.getByTestId('deals-tabs')).toContainText(/Завершённые\s*1/)
  if (!isPhone(page)) await expect(page.getByTestId('cabinet-nav-deals')).toContainText('3')
  await expect(section.getByTestId('deals-guarantor')).toContainText('Вы гарант сделок')

  const rows = section.getByTestId('deal-row')
  await expect(rows).toHaveCount(3)
  await expect(rows.filter({ hasText: 'Планшет' })).toContainText('Перевести оплату')
  await expect(rows.filter({ hasText: 'Ноутбук' })).toHaveAttribute('data-status', '3a')

  await section.getByTestId('deals-role-validator').click()
  await expect(rows).toHaveCount(1)
  await rows.getByTestId('deal-row-open').click()
  await expect(page).toHaveURL(new RegExp(`id=${HOLD_BIKE.id}`))
  await expect(page.getByTestId('deal-action')).toHaveAttribute('data-mode', 'decide')
})

test('«Как работает безопасная сделка» opens from the header', async ({ page }) => {
  test.skip(isPhone(page), 'the phone header has no such link')
  await page.goto('/')
  await page.getByRole('button', { name: 'Безопасная сделка' }).first().click()
  await expect(page.getByTestId('safe-deal-help')).toContainText('Кто платит комиссию гаранта?')
})
