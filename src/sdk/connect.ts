import type { AppInfo, BastyonSdkConstructor, HostSdk } from './types'

declare global {
  interface Window {
    BastyonSdk?: BastyonSdkConstructor
  }
}

export type ConnectMode = 'bastyon' | 'mock'

export type ConnectResult =
  | { status: 'ready'; mode: ConnectMode; sdk: HostSdk; appinfo: AppInfo }
  /** Opened outside Bastyon, and the mock is not allowed in this build. */
  | { status: 'outside' }
  /** `script` — sdk.js did not load; `timeout` — it loaded, but the host did not answer. */
  | { status: 'failed'; reason: 'script' | 'timeout'; error: unknown }

export interface ConnectOptions {
  /** Host that serves `/js/lib/apps/sdk.js`, e.g. `bastyon.com`. */
  sdkHost: string
  /** Use the mock SDK when the page is not inside a Bastyon iframe. */
  allowMock: boolean
  /** Overrides iframe detection (tests). */
  inIframe?: boolean
  /** Overrides script loading (tests). */
  loadScript?: (src: string, timeoutMs: number) => Promise<void>
  /** Overrides the mock factory (tests). */
  createMock?: () => HostSdk
  scriptTimeoutMs?: number
  initTimeoutMs?: number
}

/** sdk.js may come over Tor, so the script gets more time than the handshake. */
const SCRIPT_TIMEOUT_MS = 20_000
const INIT_TIMEOUT_MS = 15_000

export function isInIframe(win: Window = window): boolean {
  try {
    return win.self !== win.top
  } catch {
    // Cross-origin access to `top` throws, which also means we are framed.
    return true
  }
}

export function sdkScriptUrl(host: string): string {
  return `https://${host}/js/lib/apps/sdk.js`
}

/**
 * Connects to the Bastyon host.
 *
 * Inside an iframe it loads the host's sdk.js, creates `BastyonSdk` and waits
 * for the `appinfo` handshake. Outside an iframe it uses the mock SDK if the
 * build allows it (dev and test), so the UI can be worked on in a plain browser.
 */
export async function connect(options: ConnectOptions): Promise<ConnectResult> {
  const inIframe = options.inIframe ?? isInIframe()

  if (!inIframe) {
    if (!options.allowMock) return { status: 'outside' }
    const sdk = options.createMock ? options.createMock() : (await import('./mock')).createMockSdk()
    await sdk.init()
    return { status: 'ready', mode: 'mock', sdk, appinfo: await sdk.get.appinfo() }
  }

  try {
    const load = options.loadScript ?? loadScript
    await load(sdkScriptUrl(options.sdkHost), options.scriptTimeoutMs ?? SCRIPT_TIMEOUT_MS)
  } catch (error) {
    return { status: 'failed', reason: 'script', error }
  }

  const BastyonSdk = window.BastyonSdk
  if (!BastyonSdk) {
    return { status: 'failed', reason: 'script', error: new Error('sdk_missing') }
  }

  // The constructor patches history.pushState/replaceState to report route
  // changes to the host, and subscribes to host events.
  const sdk = new BastyonSdk()
  const initTimeout = options.initTimeoutMs ?? INIT_TIMEOUT_MS
  try {
    // init() never rejects: it waits for `appinfo` forever if the host is silent.
    await withTimeout(sdk.init(), initTimeout, 'sdk_init_timeout')
    // init() keeps only the manifest; the full answer has locale, theme, network.
    const appinfo = await withTimeout(sdk.get.appinfo(), initTimeout, 'sdk_appinfo_timeout')
    return { status: 'ready', mode: 'bastyon', sdk, appinfo }
  } catch (error) {
    return { status: 'failed', reason: 'timeout', error }
  }
}

export function loadScript(
  src: string,
  timeoutMs: number,
  doc: Document = document
): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = doc.createElement('script')
    const done = (error?: Error) => {
      clearTimeout(timer)
      script.onload = null
      script.onerror = null
      if (error) {
        script.remove()
        reject(error)
      } else {
        resolve()
      }
    }
    const timer = setTimeout(() => done(new Error('sdk_script_timeout')), timeoutMs)
    script.onload = () => done()
    script.onerror = () => done(new Error('sdk_script_error'))
    script.src = src
    script.async = true
    doc.head.appendChild(script)
  })
}

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}
