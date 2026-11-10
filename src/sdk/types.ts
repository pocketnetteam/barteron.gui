/**
 * Typed view of the Bastyon mini-app SDK.
 *
 * The SDK itself is `window.BastyonSdk` from `https://<host>/js/lib/apps/sdk.js`
 * (source: pocketnet.gui `js/lib/apps/sdk.js`). It talks to the host over
 * postMessage; both the previous Bastyon and bastyon-nextgen answer the same
 * actions. Only the methods Barteron uses are listed (PLAN.md, appendix A).
 *
 * Result types are exact only where the host code was checked. The rest stay
 * `unknown` until the stage that uses them pins them down.
 */

export type Permission =
  | 'account'
  | 'notifications'
  | 'chat'
  | 'messaging'
  | 'payment'
  | 'sign'
  | 'mobilecamera'
  | 'geolocation'
  | 'externallink'

/** `theme.rootid` — `'light'` or `'dark'` in bastyon-nextgen; the previous host also had a navy theme. */
export interface HostTheme {
  rootid: string
}

export interface HostProject {
  url: string
  turl?: string
  name: string
  protocol: string
  archivedPeertubeServers?: string[]
}

/** The application's own manifest as the host parsed it. */
export interface HostApplication {
  id: string
  name?: string
  /** Where the app is served from: `barteron.club` (the old app built document links on it). */
  scope?: string
  [key: string]: unknown
}

/** Answer of `get.appinfo()` (bastyon-nextgen `actions/helpers.ts`). */
export interface AppInfo {
  device?: string
  version?: string | number
  production?: boolean
  locale?: string
  theme?: HostTheme
  margintop?: string | number
  application?: HostApplication
  project?: HostProject
  /** True when the host routes traffic through Tor. */
  alttransport?: boolean
  transactionsApiVersion?: number
  pkoin?: boolean
}

/**
 * A transaction the host built and sent on the app's behalf: `action.export()`
 * of the previous client, bastyon-nextgen `src/mini-apps/tx/app-actions.ts`.
 * The host pushes it again as an `action` event on every new status.
 */
export interface HostAction {
  id?: string
  /** txid; missing while the host still queues the transaction. */
  transaction?: string | null
  /** In a block. */
  completed?: boolean
  /** Why it never made it into a block (`notconfirmed` after an hour); null — not rejected. */
  rejected?: unknown
  /** Set by sdk.js: no txid yet. */
  relay?: boolean
  /** Set by sdk.js: sent, waiting for a block. */
  temp?: boolean
  /** The object the app sent, as the host understood it (`export(true)`). */
  expObject?: Record<string, unknown>
  /** ISO dates. */
  added?: string | null
  sent?: string | null
  updated?: string | null
  [key: string]: unknown
}

/** Events the host pushes to the app (bastyon-nextgen `events/sources.ts`). */
export interface HostEvents {
  action: HostAction
  balance: unknown
  theme: HostTheme
  locale: { locale: string }
  block: unknown
  changestate: unknown
  keyboard: { state?: 'show' | 'hide'; height: number }
}

export type HostEventName = keyof HostEvents

export interface FromToTransactionsOptions {
  update?: boolean
  depth?: number
  opreturn?: string | string[]
  confirmations?: number
}

export interface HostSdk {
  /** Resolves with the application manifest once the host answers `appinfo`. */
  init(): Promise<HostApplication>
  inbastyon(): boolean
  on<K extends HostEventName>(key: K, listener: (data: HostEvents[K]) => void): void
  off<K extends HostEventName>(key: K, listener: (data: HostEvents[K]) => void): void
  emit(type: string, data?: unknown): void
  getroute(data: { route: string }): string
  serviceWorker?: {
    register(): Promise<ServiceWorkerRegistration | null>
  }
  rpc<T = unknown>(
    method: string,
    parameters?: unknown[],
    options?: Record<string, unknown>
  ): Promise<T>
  sign(text: string): Promise<unknown>

  barteron: {
    account(data: unknown): Promise<HostAction>
    offer(data: unknown): Promise<HostAction>
    removeOffer(data: { hash: string }): Promise<HostAction>
    comment(data: unknown): Promise<HostAction>
    vote(data: unknown): Promise<HostAction>
  }

  get: {
    /** Rejects when nobody is signed in to Bastyon. */
    account(): Promise<{ address: string }>
    appinfo(): Promise<AppInfo>
    applink(path?: string): string
    balance(): Promise<unknown>
    action(): Promise<unknown>
    /** This app's transactions: pending ones and those finished in the last day. */
    actions(): Promise<HostAction[]>
    fromToTransactions(
      addressFrom: string,
      addressTo: string,
      options?: FromToTransactionsOptions
    ): Promise<unknown>
    geolocation(): Promise<unknown>
    imageFromMobileCamera(): Promise<unknown>
    videos(urls: string[], update?: boolean): Promise<unknown>
  }

  images: {
    upload(data: unknown): Promise<unknown>
  }
  manageBastyonImageSrc(src?: string): string | null
  videos: {
    opendialog(data?: unknown): Promise<unknown>
    remove(data: { url: string }): Promise<unknown>
  }

  chat: {
    getOrCreateRoom(request: {
      users: string[]
      parameters?: Record<string, unknown>
    }): Promise<unknown>
    openRoom(roomid: string): Promise<unknown>
    send(request: { roomid: string; content: unknown }): Promise<unknown>
  }

  payment(data: unknown): Promise<HostAction>

  helpers: {
    alert(message: string): Promise<unknown>
    complain(data: unknown): Promise<unknown>
    share(data: unknown): Promise<unknown>
    /** Missing in older hosts. */
    shareOnBastyon?(data: unknown): void
    registration(): Promise<unknown>
    userstate(): Promise<unknown>
    opensettings(): Promise<unknown>
  }

  permissions: {
    check(request: { permission: Permission }): Promise<boolean>
    request(permissions: Permission[]): Promise<unknown>
  }

  open: {
    /** Missing in older hosts. */
    profile?(type: string, data: string): Promise<unknown>
  }

  openExternalLink(url: string): Promise<unknown>
}

/** Constructor that `sdk.js` puts on `window`. */
export type BastyonSdkConstructor = new (settings?: { publicPath?: string }) => HostSdk
