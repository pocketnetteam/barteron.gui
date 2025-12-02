const pendingRequests = new Map()

addEventListener('install', () => {
  skipWaiting()
})

addEventListener('activate', () => {
  clients.claim()
})

addEventListener('message', (event) => {
  if (event.data.type === 'FETCH_RESPONSE') {
    const { requestId, success, data, error } = event.data
    const request = pendingRequests.get(requestId)

    if (request) {
      if (success) {
        const response = new Response(new Uint8Array(data.body), {
          status: data.status,
          statusText: data.statusText,
          headers: data.headers,
        })
        request.resolve(response)
      }
      else {
        request.reject(new Error(error))
      }
      pendingRequests.delete(requestId)
    }
  }
})

addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (shouldSkipRequest(url))
    return

  event.respondWith(handleRequest(event.request))
})

function shouldSkipRequest(url) {
  if (url.origin === location.origin)
    return true

  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    return true

  let parentUrl = null
  try {
    parentUrl = new URL(window.parent.location.href)

    if (url.origin === parentUrl.origin)
      return true

    if (url.hostname === parentUrl.hostname)
      return true

    if (url.href.startsWith(parentUrl.origin))
      return true
  }
  catch (e) {
    const bastyonDomains = ['bastyon.com', 'pocketnet.app', 'localhost']
    if (bastyonDomains.some(domain => url.hostname.includes(domain)))
      return true
  }

  if (parentUrl) {
    const parentParts = parentUrl.hostname.split('.')
    const urlParts = url.hostname.split('.')

    const intersection = parentParts.filter(
      part => part.length > 2 && urlParts.includes(part),
    )

    if (intersection.length > 1)
      return true

    if (
      url.hostname.endsWith(`.${parentUrl.hostname}`)
      || parentUrl.hostname.endsWith(`.${url.hostname}`)
    )
      return true
  }

  if (url.pathname.includes('service-worker') || url.pathname.includes('sw.js'))
    return true

  if (
    url.protocol.startsWith('chrome-extension:')
    || url.protocol.startsWith('moz-extension:')
    || url.protocol.startsWith('safari-extension:')
  )
    return true

  if (
    url.protocol.startsWith('blob:')
    || url.protocol.startsWith('data:')
    || url.protocol.startsWith('file:')
  )
    return true

  if (
    url.hostname === 'localhost'
    && url.port
    && Number.parseInt(url.port) > 1024
  )
    return true

  const skipDomains = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'bastyon.com',
    'pocketnet.app',
  ]

  if (skipDomains.some(domain => url.hostname.includes(domain)))
    return true

  return false
}

async function handleRequest(request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const body
    = request.method !== 'GET' && request.method !== 'HEAD'
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

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject })

    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0)
        clientList[0].postMessage(message)
      else reject(new Error('No windows available'))
    })

    setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout'))
    }, 30000)
  })
}