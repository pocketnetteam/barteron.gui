// Fetch tunnel of the Bastyon hosts, after barteron.gui public/miniapp-service-worker.js.
// sdk.js registers it when the host routes traffic through Tor (appinfo.alttransport):
// requests to outside services then go to the host by postMessage instead of the network.
//
// Changed from the old worker (code audit, stage 11):
// - Bastyon's own servers go straight only by their exact name or a subdomain of it:
//   the old `hostname.includes('bastyon.com')` and В«'sw.js' in the pathВ» also let
//   `pocketnet.app.example.org` and `example.org/sw.js` past the tunnel, so an offer
//   photo at such an address told its server the IP of a user on Tor;
// - its `window.parent` check never ran: a service worker has no `window`;
// - the request goes to the window that made it, and only that window's answer is
//   taken (the old one asked the first window, maybe another Barteron tab);
// - an answer without a body (204, 304) settles the request instead of a 30 s wait.

/** Straight to the network: Bastyon's servers (photos, video) and this device. */
const DIRECT_DOMAINS = ['bastyon.com', 'pocketnet.app', 'localhost']
const LOOPBACK = ['127.0.0.1', '0.0.0.0', '[::1]']
/** Statuses a Response may not have a body with. */
const NO_BODY = [101, 103, 204, 205, 304]
const TIMEOUT_MS = 30000

const pendingRequests = new Map()

addEventListener('install', () => {
  skipWaiting()
})

addEventListener('activate', () => {
  clients.claim()
})

addEventListener('message', (event) => {
  const message = event.data
  if (!message || message.type !== 'FETCH_RESPONSE') return
  const request = pendingRequests.get(message.requestId)
  if (!request) return
  // Only the window the request went to answers it.
  if (request.clientId && (!event.source || event.source.id !== request.clientId)) return
  pendingRequests.delete(message.requestId)
  clearTimeout(request.timer)
  if (!message.success) {
    request.reject(new Error(message.error))
    return
  }
  try {
    const data = message.data
    const body = NO_BODY.includes(data.status) ? null : new Uint8Array(data.body || [])
    request.resolve(
      new Response(body, {
        status: data.status,
        statusText: data.statusText,
        headers: data.headers,
      })
    )
  } catch (error) {
    request.reject(error)
  }
})

addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (shouldSkipRequest(url)) return

  event.respondWith(handleRequest(event.request, event.clientId))
})

function isOrUnder(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

function shouldSkipRequest(url) {
  if (url.origin === location.origin) return true

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true

  if (LOOPBACK.includes(url.hostname)) return true

  return DIRECT_DOMAINS.some((domain) => isOrUnder(url.hostname, domain))
}

function newRequestId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return `req_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

/** The window that made the request; the first one if it is not known. */
async function windowFor(clientId) {
  const own = clientId ? await clients.get(clientId) : null
  if (own) return own
  const list = await clients.matchAll({ type: 'window' })
  return list[0] || null
}

async function handleRequest(request, clientId) {
  const requestId = newRequestId()

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? Array.from(new Uint8Array(await request.arrayBuffer()))
      : null

  const message = {
    type: 'FETCH_REQUEST',
    requestId,
    request: {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
    },
  }

  const target = await windowFor(clientId)
  if (!target) throw new Error('No windows available')

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout'))
    }, TIMEOUT_MS)
    pendingRequests.set(requestId, { resolve, reject, timer, clientId: target.id })
    target.postMessage(message)
  })
}
