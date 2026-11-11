import { demoDeals, demoNetworkData } from './mock-data'
import { createMockNetwork, type MockNetwork, type MockWrite } from './mock-network'
import type { AppInfo, HostAction, HostEventName, HostEvents, HostSdk, Permission } from './types'

/** Not a real address: the mock never reaches the network. */
export const MOCK_ADDRESS = 'PMockUser1111111111111111111111111'

export const MOCK_APP_ID = 'barteron.pocketnet.app'

export type MockRpcHandler = (parameters: unknown[]) => unknown

export interface MockOptions {
  /** `null` — nobody is signed in to Bastyon. */
  address?: string | null
  /** Permissions the host already granted. The new Bastyon grants these two to Barteron. */
  granted?: Permission[]
  /** What `permissions.request` grants. By default, everything asked. */
  grantOnRequest?: boolean
  locale?: string
  /** Without it the mock follows the OS colour scheme, like a host would. */
  theme?: 'light' | 'dark'
  /** RPC fixtures by method name; they win over the network. A method without either rejects. */
  rpc?: Record<string, MockRpcHandler>
  /** In-memory Barteron network: answers node reads and confirms writes. */
  network?: MockNetwork
}

export interface MockCall {
  method: string
  args: unknown[]
}

export interface MockControls {
  /** Every SDK call, in order. */
  readonly calls: MockCall[]
  /** Simulates an event pushed by the host. */
  push<K extends HostEventName>(key: K, data: HostEvents[K]): void
  readonly granted: ReadonlySet<Permission>
  /** The next call of this method fails: an upload error, a closed video window. */
  failNext(method: string): void
}

export type MockSdk = HostSdk & { mock: MockControls }

/**
 * In-memory stand-in for the Bastyon SDK, used when the app runs outside
 * Bastyon (dev, e2e). It answers like bastyon-nextgen does, without network.
 */
export function createMockSdk(options: MockOptions = {}): MockSdk {
  const address = options.address === undefined ? MOCK_ADDRESS : options.address
  const granted = new Set<Permission>(options.granted ?? ['account', 'chat'])
  const grantOnRequest = options.grantOnRequest ?? true
  const rpcFixtures = { ...options.network?.rpc, ...options.rpc }
  const calls: MockCall[] = []
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  let txCounter = 0
  let videoCounter = 0
  const failing = new Set<string>()
  const fails = (method: string): boolean => failing.delete(method)

  const darkQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null
  const osTheme = () => (darkQuery?.matches ? 'dark' : 'light')

  const record = (method: string, ...args: unknown[]) => {
    calls.push({ method, args })
  }

  const appinfo = (): AppInfo => ({
    device: 'browser',
    version: 'mock',
    production: false,
    locale: options.locale ?? navigator.language.split('-')[0],
    theme: { rootid: options.theme ?? osTheme() },
    margintop: '0px',
    application: { id: MOCK_APP_ID, name: 'Barteron' },
    project: {
      url: 'bastyon.com',
      turl: 'test.pocketnet.app',
      name: 'Bastyon',
      protocol: 'bastyon',
      archivedPeertubeServers: [],
    },
    alttransport: false,
    pkoin: true,
    // Both hosts say 8 (bastyon-nextgen host-context.ts, pocketnet.gui apps/index.js).
    transactionsApiVersion: 8,
  })

  const requireSignedIn = (): string => {
    if (!address) throw new Error('not_authenticated')
    return address
  }

  const requirePermission = (permission: Permission) => {
    if (!granted.has(permission)) throw new Error(`permission:${permission}`)
  }

  /**
   * Writes: with a network, broadcast and a block later; without one, a fake
   * broadcast transaction that never confirms.
   */
  const sendTx = async (method: string, data: unknown): Promise<HostAction> => {
    record(method, data)
    const author = requireSignedIn()
    if (options.network) {
      const kind = method.replace('barteron.', '') as MockWrite
      return options.network.send(kind, data, author)
    }
    txCounter += 1
    return { transaction: `mocktx${String(txCounter).padStart(58, '0')}`, completed: false }
  }

  const resolved = async (method: string, ...args: unknown[]): Promise<unknown> => {
    record(method, ...args)
    return undefined
  }

  const sdk: MockSdk = {
    async init() {
      record('init')
      return { id: MOCK_APP_ID, name: 'Barteron' }
    },
    inbastyon: () => false,
    on(key, listener) {
      const set = listeners.get(key) ?? new Set()
      set.add(listener as (data: unknown) => void)
      listeners.set(key, set)
    },
    off(key, listener) {
      listeners.get(key)?.delete(listener as (data: unknown) => void)
    },
    emit(type, data) {
      record('emit', type, data)
    },
    getroute: ({ route }) => `/${route}`,
    async rpc<T>(method: string, parameters: unknown[] = []): Promise<T> {
      record('rpc', method, parameters)
      const fixture = rpcFixtures[method]
      if (!fixture) throw new Error(`mock_rpc_missing:${method}`)
      return fixture(parameters) as T
    },
    async sign(text) {
      record('sign', text)
      requireSignedIn()
      requirePermission('sign')
      return `mocksignature:${text}`
    },

    barteron: {
      account: (data) => sendTx('barteron.account', data),
      offer: (data) => sendTx('barteron.offer', data),
      removeOffer: (data) => sendTx('barteron.removeOffer', data),
      comment: (data) => sendTx('barteron.comment', data),
      vote: (data) => sendTx('barteron.vote', data),
    },

    get: {
      async account() {
        record('get.account')
        requirePermission('account')
        return { address: requireSignedIn() }
      },
      async appinfo() {
        record('get.appinfo')
        return appinfo()
      },
      applink: (path = '') =>
        `bastyon://application?id=${MOCK_APP_ID}&p=${encodeURIComponent(path)}`,
      async balance() {
        record('get.balance')
        requireSignedIn()
        // The shape bastyon-nextgen answers with (`actions/wallet.ts`).
        return { available: 842.5, frozen: 0 }
      },
      action: () => resolved('get.action'),
      actions: async () => {
        record('get.actions')
        return options.network?.actions() ?? []
      },
      fromToTransactions: async (from, to, opts) => {
        record('get.fromToTransactions', from, to, opts)
        return []
      },
      async geolocation() {
        record('get.geolocation')
        requirePermission('geolocation')
        // Any fixed point will do; this one is Belgrade.
        return { latitude: 44.8125, longitude: 20.4612 }
      },
      imageFromMobileCamera: () => resolved('get.imageFromMobileCamera'),
      videos: async (urls) => {
        record('get.videos', urls)
        // No PeerTube offline. A demo video with «processing» in its link is
        // always being processed (state 2); one from the upload window is
        // processed until its `ready` time, then ready without a playlist.
        return urls.map((url) => {
          const readyAt = Number(url.match(/[?&]ready=(\d+)/)?.[1] ?? 0)
          const state = url.includes('failed')
            ? 7
            : url.includes('processing') || readyAt > Date.now()
              ? 2
              : readyAt
                ? 1
                : 0
          return state
            ? {
                data: {
                  original: {
                    state: { id: state },
                    duration: 42,
                    // A ready video has a playlist; offline it never plays.
                    streamingPlaylists:
                      state === 1 ? [{ playlistUrl: 'https://mock.video/master.m3u8' }] : [],
                  },
                  thumbnail: '',
                },
              }
            : {}
        })
      },
    },

    images: {
      async upload(data) {
        record('images.upload', data)
        requireSignedIn()
        const images = (data as { images?: unknown })?.images
        const list = Array.isArray(images)
          ? images.filter((i): i is string => typeof i === 'string')
          : []
        if (list.length > 10) throw new Error('images:max:10')
        await new Promise((r) => setTimeout(r, 700))
        if (fails('images.upload')) return list.map(() => ({ error: 'mock: upload failed' }))
        // Stored as a small copy: drafts and the mock chain keep it in memory and localStorage.
        const { shrinkPhoto } = await import('@/lib/image')
        return Promise.all(
          list.map(async (img) => ({ url: await shrinkPhoto(img, 240, 0.7).catch(() => img) }))
        )
      },
    },
    manageBastyonImageSrc: (src = '') => src,
    videos: {
      async opendialog(data) {
        record('videos.opendialog', data)
        requireSignedIn()
        await new Promise((r) => setTimeout(r, 500))
        // The window was closed without a video.
        if (fails('videos.opendialog')) return null
        videoCounter += 1
        // Processed in 6 seconds, like a short clip.
        return {
          link: `peertube://mock.video/v${videoCounter}?ready=${Date.now() + 6000}`,
          name: 'video.mp4',
        }
      },
      remove: (data) => resolved('videos.remove', data),
    },

    chat: {
      async getOrCreateRoom(request) {
        record('chat.getOrCreateRoom', request)
        requirePermission('chat')
        return { roomid: 'mock-room' }
      },
      openRoom: (roomid) => resolved('chat.openRoom', roomid),
      send: (request) => resolved('chat.send', request),
    },

    // The wallet window: needs `payment`; `failNext('payment')` — the user closed it.
    payment: async (data) => {
      requirePermission('payment')
      if (fails('payment')) {
        record('payment', data)
        // Both hosts reject a closed window with the string `cancel`.
        throw 'cancel'
      }
      return sendTx('payment', data)
    },

    helpers: {
      alert: (message) => resolved('helpers.alert', message),
      complain: (data) => resolved('helpers.complain', data),
      share: (data) => resolved('helpers.share', data),
      shareOnBastyon: (data) => {
        record('helpers.shareOnBastyon', data)
      },
      registration: () => resolved('helpers.registration'),
      userstate: async () => {
        record('helpers.userstate')
        return Boolean(address)
      },
      opensettings: () => resolved('helpers.opensettings'),
    },

    permissions: {
      async check({ permission }) {
        record('permissions.check', permission)
        return granted.has(permission)
      },
      async request(permissions) {
        record('permissions.request', permissions)
        if (grantOnRequest) permissions.forEach((p) => granted.add(p))
        return undefined
      },
    },

    open: {
      profile: (type, data) => resolved('open.profile', type, data),
    },

    openExternalLink: (url) => resolved('openExternalLink', url),

    mock: {
      calls,
      granted,
      failNext: (method) => void failing.add(method),
      push(key, data) {
        listeners.get(key)?.forEach((listener) => listener(data))
      },
    },
  }

  options.network?.subscribe((action) => sdk.mock.push('action', action))

  // Like a host that follows the OS: tell the app when the scheme changes.
  if (!options.theme) {
    darkQuery?.addEventListener?.('change', () => sdk.mock.push('theme', { rootid: osTheme() }))
  }

  return sdk
}

/** The mock the app uses in dev: signed in, with demo offers and sellers. */
export function createDemoMockSdk(options: Omit<MockOptions, 'network'> = {}): MockSdk {
  const address = options.address === undefined ? MOCK_ADDRESS : options.address
  const me = address ?? MOCK_ADDRESS
  if (address) seedDemoDeals(address)
  const data = demoNetworkData(me)
  // e2e can lower the user's Bastyon reputation before the app starts.
  const setup =
    typeof window !== 'undefined'
      ? (window as { __barteronMockSetup?: { reputation?: number } }).__barteronMockSetup
      : undefined
  if (typeof setup?.reputation === 'number') {
    data.profiles = data.profiles?.map((p) =>
      p.address === me ? { ...p, reputation: setup.reputation } : p
    )
  }
  return createMockSdk({
    ...options,
    // A block every 10 s: a safe deal transfer counts in a minute, not in ten.
    network: createMockNetwork({ ...data, blockMs: 10_000 }),
  })
}

/**
 * The demo deals go into the device list once, the first time the mock
 * starts for this user (stores/deals.ts reads `<address>_deals`). A list
 * already there, even an empty one, stays as it is.
 */
function seedDemoDeals(address: string) {
  try {
    const key = `${address}_deals`
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify(demoDeals(address).deals))
    }
  } catch {
    // No storage: the list starts empty.
  }
}
