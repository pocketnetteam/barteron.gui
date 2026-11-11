import { expect, test, type Page } from '@playwright/test'

/**
 * Stage 8 on the mock network: low scores and their moderation. The mock
 * user has 150 reputation and is a moderator in dev builds; Илья is the
 * other moderator on duty, and yesterday he let the mock user give Дмитрий's
 * coffee machine a «2» (sdk/mock-data.ts). Chats and profile writes go to
 * the mock host; nothing leaves the machine.
 */
const ME = 'PMockUser1111111111111111111111111'
const addr = (name: string) => `PDemo${name}`.padEnd(34, '1')
const ILYA = addr('IyaPetrov')
const ANNA = addr('AnnaKovaeva')
const txid = (label: string) =>
  Array.from(label)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(64, 'a')
    .slice(0, 64)
const BIKE = txid('bike')
const COFFEE = txid('coffee')
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

test('a low score: the request goes to a moderator on duty, then I wait', async ({ page }) => {
  await page.goto(`/barter/${BIKE}`)
  const form = page.getByTestId('review-form').filter({ visible: true })
  await form.getByRole('radio', { name: '2 звезды' }).click()
  await expect(form.getByTestId('moderation-needed')).toBeVisible()
  await form.getByTestId('moderation-open').click()

  const dialog = page.getByRole('dialog', { name: 'Заявка на модерацию оценки' })
  await expect(dialog).toContainText('Ваша оценка: 2')
  await dialog.getByTestId('moderation-reason').fill('Колесо погнуто')
  await dialog.getByTestId('moderation-send').click()
  await expect(dialog).toBeHidden()

  // I am a moderator myself, but not for my own score: Илья gets it.
  const [room] = await callsOf(page, 'chat.getOrCreateRoom')
  expect(room?.args[0]).toEqual({ users: [ILYA], parameters: {} })
  const [sent] = await callsOf(page, 'chat.send')
  expect(sent?.args[0]).toMatchObject({
    content: {
      messages: [
        'Заявка на модерацию низкой оценки объявлению',
        'Причина: Колесо погнуто',
        applink(
          `barter/moderation?offer=${BIKE}&user=${ME}&score=2&reason=${encodeURIComponent('Колесо погнуто').replace(/%20/g, '+')}`
        ),
      ],
    },
  })
  // The request goes into my profile, the old app's way plus score and moderator.
  const [account] = await callsOf(page, 'barteron.account')
  const requests = (
    account?.args[0] as { metaData: { votingModeration: { requestItems: unknown[] } } }
  ).metaData.votingModeration.requestItems
  expect(requests.at(-1)).toMatchObject({ offerId: BIKE, score: 2, moderator: ILYA })
  await expect(form.getByTestId('moderation-waiting')).toContainText('Заявка на оценку «2»')
  expect(await callsOf(page, 'barteron.vote')).toHaveLength(0)
})

test('a moderator allowed «2»: not lower, and «2» goes as a score', async ({ page }) => {
  await page.goto(`/barter/${COFFEE}`)
  const form = page.getByTestId('review-form').filter({ visible: true })
  await expect(form.getByTestId('moderation-allowed')).toContainText('Модератор одобрил оценку «2»')
  await form.getByRole('radio', { name: '1 звезда' }).click()
  await expect(form).toContainText('ниже согласованной модератором «2»')
  await expect(form.getByTestId('review-send')).toBeDisabled()
  await form.getByRole('radio', { name: '2 звезды' }).click()
  await form.getByTestId('review-send').click()
  await page.getByTestId('confirm-action').click()
  await expect.poll(async () => (await callsOf(page, 'barteron.vote')).length).toBe(1)
  const [vote] = await callsOf(page, 'barteron.vote')
  expect(vote?.args[0]).toMatchObject({ share: COFFEE, value: 2 })
})

test('the moderator decides: the decision into the profile, the user hears in the chat', async ({
  page,
}) => {
  const reason = 'Велосипед пришёл с погнутым задним колесом'
  await page.goto(
    `/barter/moderation?${new URLSearchParams({ offer: BIKE, user: ANNA, score: '2', reason })}`
  )
  const view = page.getByTestId('moderation-page')
  await expect(view).toHaveAttribute('data-state', 'ready')
  await expect(page.getByTestId('moderation-badge')).toHaveText('Ждёт решения')
  await expect(page.getByTestId('moderation-reason-text')).toContainText(reason)
  await expect(page.getByTestId('moderation-execute')).toBeDisabled()

  await page.getByTestId('moderation-reject').click()
  await page.getByTestId('moderation-rejection').fill('Продавец вернул деньги')
  await page.getByTestId('moderation-execute').click()
  await expect(page.getByTestId('moderation-done')).toContainText('Благодарим вас')

  const [account] = await callsOf(page, 'barteron.account')
  const items = (account?.args[0] as { metaData: { votingModeration: { accessItems: unknown[] } } })
    .metaData.votingModeration.accessItems
  expect(items.at(-1)).toMatchObject({
    offerId: BIKE,
    userAddress: ANNA,
    score: 2,
    status: 'rejected',
  })
  const [room] = await callsOf(page, 'chat.getOrCreateRoom')
  expect(room?.args[0]).toEqual({ users: [ANNA], parameters: { name: 'Велосипед горный, рама M' } })
  const [sent] = await callsOf(page, 'chat.send')
  expect(sent?.args[0]).toMatchObject({
    content: {
      messages: [
        applink(`barter/${BIKE}`),
        'Заявка на проставление низкой оценки данному объявлению отклонена',
        'Причина: Продавец вернул деньги',
      ],
    },
  })
})

test('a broken request link says so', async ({ page }) => {
  await page.goto(`/barter/moderation?offer=${BIKE}&user=${ANNA}&score=5`)
  await expect(page.getByTestId('moderation-page')).toHaveAttribute('data-state', 'bad')
})
