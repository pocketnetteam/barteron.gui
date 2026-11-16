// @vitest-environment node
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Fetch events and messages need only these fields. */
interface FetchEvent {
  request: Request
  clientId: string
  respondWith(response: Promise<Response>): void
}
interface Window {
  id: string
  sent: { type: string; requestId: string; request: { url: string; method: string } }[]
  postMessage(message: unknown): void
}

const WORKER = readFileSync(
  new URL('../../public/miniapp-service-worker.js', import.meta.url),
  'utf8'
)

/** The worker in a scope of its own, as a browser runs it, with two Barteron windows. */
function loadWorker(windows = ['w1', 'w2']) {
  const listeners: Record<string, (event: unknown) => void> = {}
  const clients: Window[] = windows.map((id) => {
    const sent: Window['sent'] = []
    return { id, sent, postMessage: (m) => sent.push(m as Window['sent'][number]) }
  })
  const scope = {
    addEventListener: (type: string, listener: (event: unknown) => void) =>
      (listeners[type] = listener),
    skipWaiting: () => undefined,
    clients: {
      claim: async () => undefined,
      get: async (id: string) => clients.find((c) => c.id === id),
      matchAll: async () => clients,
    },
    location: new URL('https://barteron.club/miniapp-service-worker.js'),
    crypto: globalThis.crypto,
    setTimeout: (f: () => void, ms: number) => setTimeout(f, ms),
    clearTimeout: (t: ReturnType<typeof setTimeout>) => clearTimeout(t),
    Response,
    URL,
    Uint8Array,
    Map,
    Error,
    Promise,
    Object,
    Array,
  }
  vm.runInNewContext(WORKER, scope)

  /** `null` — the worker let the request go straight to the network. */
  function fetch(url: string, clientId = 'w1', init?: RequestInit): Promise<Response> | null {
    let response: Promise<Response> | null = null
    const event: FetchEvent = {
      request: new Request(url, init),
      clientId,
      respondWith: (r) => {
        response = r
      },
    }
    listeners.fetch!(event)
    return response
  }
  const answer = (from: string | null, data: unknown) =>
    listeners.message!({ source: from ? clients.find((c) => c.id === from) : null, data })
  /** The request the worker passed to a window, once it is there. */
  const asked = async (window: string) => {
    const client = clients.find((c) => c.id === window)!
    await vi.waitFor(() => expect(client.sent).toHaveLength(1))
    return client.sent[0]!
  }
  return { fetch, answer, asked, clients }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('the Tor fetch tunnel (public/miniapp-service-worker.js)', () => {
  it('Bastyon’s servers and this device go straight; look-alike addresses go through the host', () => {
    const sw = loadWorker()
    for (const url of [
      'https://barteron.club/assets/index.js',
      'https://bastyon.com:8092/i/photo.jpg',
      'https://peertube160.pocketnet.app/static/photo.jpg',
      'http://localhost:5180/src/main.ts',
      'http://127.0.0.1:8899/x',
      'data:image/png;base64,AAAA',
    ]) {
      expect(sw.fetch(url), url).toBeNull()
    }
    for (const url of [
      'https://nominatim.openstreetmap.org/search?q=Tver',
      // Photos of an offer at addresses its author chose: the old worker let these past Tor.
      'https://pocketnet.app.example.org/photo.jpg',
      'https://bastyon.com.example.org/photo.jpg',
      'https://evilbastyon.com/photo.jpg',
      'https://example.org/service-worker/photo.jpg',
      'https://example.org/sw.js',
      'https://notlocalhost.example.org/photo.jpg',
    ]) {
      const tunneled = sw.fetch(url)
      expect(tunneled, url).not.toBeNull()
      // Nobody answers here: let it fail quietly later.
      void tunneled?.catch(() => undefined)
    }
  })

  it('asks through the window that made the request, and takes the answer only from it', async () => {
    const sw = loadWorker()
    const response = sw.fetch('https://api.coingecko.com/api/v3/simple/price?ids=pocketnet', 'w2')!
    const request = await sw.asked('w2')
    expect(request).toMatchObject({
      type: 'FETCH_REQUEST',
      request: {
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=pocketnet',
        method: 'GET',
      },
    })
    expect(request.requestId).toMatch(/^req_[0-9a-f]{32}$/)
    expect(sw.clients[0]!.sent).toEqual([])

    const reply = (body: string) => ({
      type: 'FETCH_RESPONSE',
      requestId: request.requestId,
      success: true,
      data: {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: Array.from(new TextEncoder().encode(body)),
      },
    })
    // Another window, or nobody's, cannot answer it.
    sw.answer('w1', reply('{"fake":1}'))
    sw.answer(null, reply('{"fake":2}'))
    sw.answer('w2', reply('{"pocketnet":{"usd":0.01}}'))
    const r = await response
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toBe('application/json')
    expect(await r.json()).toEqual({ pocketnet: { usd: 0.01 } })
  })

  it('sends the body of a POST; a request from an unknown window goes to the first one', async () => {
    const sw = loadWorker()
    void sw
      .fetch('https://p2p.back.pocketnet.app.example.org/x', '', { method: 'POST', body: 'ab' })
      ?.catch(() => undefined)
    const request = (await sw.asked('w1')) as unknown as { request: { body: number[] } }
    expect(request.request.body).toEqual([97, 98])
  })

  it('a host refusal and an answer without a body settle at once', async () => {
    const sw = loadWorker()
    const refused = sw.fetch('https://tile.openstreetmap.org/1/1/1.png')!
    const first = await sw.asked('w1')
    sw.answer('w1', {
      type: 'FETCH_RESPONSE',
      requestId: first.requestId,
      success: false,
      error: 'forbidden_host',
    })
    await expect(refused).rejects.toThrow('forbidden_host')

    const empty = sw.fetch('https://min-api.cryptocompare.com/data/price', 'w2')!
    const second = await sw.asked('w2')
    sw.answer('w2', {
      type: 'FETCH_RESPONSE',
      requestId: second.requestId,
      success: true,
      data: { status: 204, statusText: 'No Content', headers: {}, body: [] },
    })
    expect((await empty).status).toBe(204)

    // A status no Response can have (an opaque 0): fails now, not in 30 seconds.
    const odd = sw.fetch('https://min-api.cryptocompare.com/data/price')!
    await vi.waitFor(() => expect(sw.clients[0]!.sent).toHaveLength(2))
    sw.answer('w1', {
      type: 'FETCH_RESPONSE',
      requestId: sw.clients[0]!.sent[1]!.requestId,
      success: true,
      data: { status: 0, statusText: '', headers: {}, body: [] },
    })
    await expect(odd).rejects.toThrow(RangeError)
  })

  it('no window to ask, or no answer in 30 seconds: the request fails', async () => {
    await expect(loadWorker([]).fetch('https://api.coingecko.com/x')).rejects.toThrow(
      'No windows available'
    )
    vi.useFakeTimers()
    const sw = loadWorker()
    const silent = sw.fetch('https://api.coingecko.com/x')!
    const failed = expect(silent).rejects.toThrow('Timeout')
    await vi.advanceTimersByTimeAsync(30_000)
    await failed
  })
})
