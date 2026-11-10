import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test, type Page } from '@playwright/test'

/**
 * The app inside a fake Bastyon host, talking through the real legacy sdk.js.
 *
 * The host page lives on another origin and frames the dev server, like
 * Bastyon does. It answers the SDK actions over postMessage with the same
 * message shapes as pocketnet.gui `js/lib/apps/index.js` and bastyon-nextgen
 * `src/mini-apps/core/bridge.ts`: request `{ id, action, data }`, answer
 * `{ response: id, data }` or `{ response: id, error }`.
 */

const APP_URL = 'http://localhost:5180/dev/status'
const HOST_ADDRESS = 'PHostUser22222222222222222222222222'
const SDK_SOURCE = readFileSync(new URL('./fixtures/bastyon-sdk.js', import.meta.url), 'utf8')

interface HostOptions {
  /** Permissions the host reports as granted. */
  granted: string[]
  locale: string
}

function hostPage({ granted, locale }: HostOptions): string {
  return `<!doctype html>
<html><body style="margin:0">
<iframe id="app" src="${APP_URL}" style="width:100%;height:100vh;border:0"></iframe>
<script>
  const granted = new Set(${JSON.stringify(granted)})
  window.__requests = []
  window.__events = []
  const answers = {
    appinfo: () => ({
      device: 'fake-host',
      production: false,
      locale: ${JSON.stringify(locale)},
      theme: { rootid: 'dark' },
      margintop: '0px',
      application: { id: 'barteron.pocketnet.app', name: 'Barteron' },
      project: { url: 'bastyon.com', turl: 'test.pocketnet.app', name: 'Fake Bastyon', protocol: 'bastyon', archivedPeertubeServers: [] },
      alttransport: false,
    }),
    checkPermission: (data) => granted.has(data.permission),
    requestPermissions: (data) => { data.permissions.forEach((p) => granted.add(p)) },
    account: () => {
      if (!granted.has('account')) throw new Error('permission')
      return { address: ${JSON.stringify(HOST_ADDRESS)} }
    },
  }
  window.addEventListener('message', (event) => {
    const message = event.data || {}
    if (message.event) window.__events.push(message)
    if (!message.action) return
    window.__requests.push(message.action)
    const answer = answers[message.action]
    try {
      if (!answer) throw new Error('unknown action ' + message.action)
      event.source.postMessage({ response: message.id, data: answer(message.data || {}) }, '*')
    } catch (error) {
      event.source.postMessage({ response: message.id, error: String(error.message) }, '*')
    }
  })
</script>
</body></html>`
}

/**
 * The host page is served by a real server on 127.0.0.1: a different origin
 * from the app, but loopback like the bastyon-nextgen dev host. A page that
 * Playwright fulfils itself counts as public, and Chrome's Local Network
 * Access checks then refuse to frame localhost.
 */
let server: Server
let hostOrigin = ''

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    const granted = (url.searchParams.get('granted') ?? '').split(',').filter(Boolean)
    const locale = url.searchParams.get('locale') ?? 'ru'
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(hostPage({ granted, locale }))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  hostOrigin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

async function openInHost(page: Page, { granted, locale }: HostOptions) {
  await page.route('https://bastyon.com/js/lib/apps/sdk.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: SDK_SOURCE })
  )
  const query = new URLSearchParams({ granted: granted.join(','), locale })
  await page.goto(`${hostOrigin}/?${query}`)
  return page.frameLocator('#app')
}

test.describe('inside a Bastyon host with the real sdk.js', () => {
  test('connects, takes language and theme from the host and reads the address', async ({
    page,
  }) => {
    const app = await openInHost(page, { granted: ['account'], locale: 'sr' })

    await expect(app.getByTestId('status-mode')).toHaveText('Унутар Bastyon-а')
    await expect(app.getByTestId('status-host')).toHaveText('Fake Bastyon')
    await expect(app.getByTestId('status-theme')).toHaveText('dark')
    await expect(app.getByTestId('status-account')).toHaveText(HOST_ADDRESS)
    // «Системная» (the default) follows the host theme.
    await expect(app.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('asks the host for account access when it is not granted', async ({ page }) => {
    const app = await openInHost(page, { granted: [], locale: 'ru' })

    await expect(app.getByTestId('status-account')).toContainText('Нет доступа к аккаунту')
    await app.getByRole('button', { name: 'Разрешить доступ' }).click()
    await expect(app.getByTestId('status-account')).toHaveText(HOST_ADDRESS)
    expect(
      await page.evaluate(() => (window as unknown as { __requests: string[] }).__requests)
    ).toContain('requestPermissions')
  })

  test('reports in-app navigation to the host', async ({ page }) => {
    const app = await openInHost(page, { granted: ['account'], locale: 'ru' })
    await app.getByRole('link', { name: '/about' }).click()
    await expect(app.getByTestId('stub-title')).toContainText('about')

    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as { __events: { event: string; data: { value: string } }[] }).__events
            .filter((e) => e.event === 'changestate')
            .map((e) => e.data.value)
        )
      )
      .toContain('about')
  })
})
