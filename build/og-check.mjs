// Checks the link previews of a build (index.php + og.php) on a real PHP
// against a fake node. Nothing goes to the network.
//
//   pnpm build
//   node build/og-check.mjs --php C:\path\to\php.exe   # PHP 7.0+ with curl
//
// --root <dir>  what to serve (default: dist)
// --json        print what every link got, without checking (to compare builds)

import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : fallback
}
const PHP = option('--php', process.env.PHP || 'php')
const ROOT = option('--root', 'dist')
const JSON_ONLY = args.includes('--json')
const ROUTER = fileURLToPath(new URL('./og-router.php', import.meta.url))

// --- Fake node -------------------------------------------------------------

const BIKE = 'a'.repeat(64)
const GUITAR = 'b'.repeat(64)
const EVIL = 'e'.repeat(64)
const SLOW = '5'.repeat(64)
const UNKNOWN = '0'.repeat(64)
const SELLER = 'PSe11er' + '2'.repeat(27)
const BUYER = 'PBuyer' + '3'.repeat(28)
const GUARANTOR = 'PGuarantor' + '4'.repeat(24)
const USER = 'PUser' + '5'.repeat(29)

const BIKE_TITLE = 'Велосипед "Stels" C++ 50% <b>'
const EVIL_TITLE = '"><script>alert(1)</script>'
const offer = (hash, address, caption, description, images) => ({
  s1: address,
  s2: hash,
  p: { s2: caption, s3: description, s5: JSON.stringify(images) },
})
const OFFERS = {
  [BIKE]: offer(BIKE, SELLER, BIKE_TITLE, 'Почти новый & недорого', [
    'https://img.example/bike.jpg',
  ]),
  [GUITAR]: offer(GUITAR, BUYER, 'Гитара', 'Акустическая', []),
  [EVIL]: offer(EVIL, SELLER, EVIL_TITLE, "'><img src=x onerror=alert(2)>", [
    '"><script>alert(3)</script>',
  ]),
}
const PROFILES = {
  [SELLER]: { address: SELLER, name: 'Илья', i: 'https://img.example/ilya.jpg' },
  [BUYER]: { address: BUYER, name: 'Мария', i: '' },
  [GUARANTOR]: { address: GUARANTOR, name: 'Анна', i: '' },
  [USER]: { address: USER, name: 'Дмитрий', i: '' },
}

let nodeCalls = 0
const node = http.createServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    nodeCalls++
    const method = (req.url ?? '').replace(/^\/rpc\//, '')
    const params = JSON.parse(body || '{}').parameters ?? []
    const list = Array.isArray(params[0]) ? params[0] : []
    const answer = (data) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ result: 'success', data }))
    }
    if (method === 'getbarteronoffersbyroottxhashes') {
      const data = list.map((hash) => OFFERS[hash]).filter(Boolean)
      if (list.includes(SLOW)) setTimeout(() => answer(data), 10_000)
      else answer(data)
    } else if (method === 'getuserprofile') {
      answer(list.map((address) => PROFILES[address]).filter(Boolean))
    } else {
      res.statusCode = 404
      res.end('Cannot POST')
    }
  })
})

// --- Links and what their previews must say --------------------------------

const RU = 'ru-RU,ru;q=0.9,en;q=0.8'
const EN = 'en-US,en;q=0.9'
const DEFAULTS = { title: 'Barteron', image: 'https://barteron.club/b_icon.png' }
const BIKE_OG = {
  title: BIKE_TITLE,
  description: 'Почти новый & недорого',
  image: 'https://img.example/bike.jpg',
}
const deal = `/barter/safedeal?id=1&offer=${BIKE}&buyer=${BUYER}&validator=${GUARANTOR}&fee=2`

const CASES = [
  { name: 'главная', path: '/', lang: null, og: DEFAULTS },
  { name: 'объявление', path: `/barter/${BIKE}`, lang: RU, og: BIKE_OG },
  { name: 'объявление, ?lang', path: `/barter/${BIKE}?lang=ru`, lang: null, og: BIKE_OG },
  { name: 'разметка в тексте', path: `/barter/${EVIL}`, lang: EN, og: { title: EVIL_TITLE } },
  {
    name: 'обмен',
    path: `/barter/search?source=${BIKE}&target=${GUITAR}`,
    lang: RU,
    og: {
      title: 'Предложение обмена',
      description: `Предлагаю обмен "${BIKE_TITLE}" на "Гитара"`,
      image: BIKE_OG.image,
    },
  },
  {
    name: 'обмен, английский',
    path: `/barter/search?source=${BIKE}&target=${GUITAR}`,
    lang: EN,
    og: {
      title: 'Exchange proposal',
      description: `I propose to exchange "${BIKE_TITLE}" for "Гитара"`,
    },
  },
  {
    name: 'варианты для одного',
    path: `/barter/search?source=${BIKE}`,
    lang: RU,
    og: { title: 'Предложения обмена', description: `Список предложений для "${BIKE_TITLE}"` },
  },
  {
    name: 'сделка',
    path: deal,
    lang: RU,
    og: {
      title: 'Безопасная сделка',
      description: `Гарант: Анна, процент: 2%; Продавец: Илья; Покупатель: Мария; Предмет сделки: ${BIKE_TITLE}`,
      image: 'https://barteron.club/s_icon.png',
    },
  },
  {
    name: 'сделка, английский',
    path: deal,
    lang: EN,
    og: {
      title: 'Safe deal',
      description: `Guarantor: Анна, fee: 2%; Seller: Илья; Buyer: Мария; Subject of the deal: ${BIKE_TITLE}`,
    },
  },
  {
    name: 'сделка, нода не знает',
    path: `/barter/safedeal?offer=${UNKNOWN}`,
    lang: EN,
    og: { title: 'Safe deal', description: 'Open the deal to check the current status' },
  },
  {
    name: 'модерация',
    path: `/barter/moderation?offer=${BIKE}&user=${USER}&score=1&reason=x`,
    lang: RU,
    og: {
      title: 'Заявка на модерацию оценки',
      description: `Объявление: ${BIKE_TITLE}; Пользователь: Дмитрий; Оценка: 1`,
      image: 'https://barteron.club/m_icon.png',
    },
  },
  {
    name: 'профиль',
    path: `/profile/${SELLER}`,
    lang: EN,
    og: {
      title: 'Илья',
      description: "Илья's profile on Barteron",
      image: 'https://img.example/ilya.jpg',
    },
  },
  {
    name: 'профиль, русский',
    path: `/profile/${SELLER}`,
    lang: RU,
    og: { description: 'Профиль Илья на Barteron' },
  },
  { name: 'варианты обмена', path: `/barter/exchange/${BIKE}`, lang: RU, og: BIKE_OG },
  { name: 'нет объявления', path: `/barter/${UNKNOWN}`, lang: RU, og: DEFAULTS },
  { name: 'не id', path: '/barter/create', lang: RU, og: DEFAULTS, noNode: true },
  { name: 'категория', path: '/category/1', lang: RU, og: DEFAULTS },
  {
    name: 'массивы в ссылке',
    path: '/barter/safedeal?offer[]=x&buyer[]=y',
    lang: null,
    og: { title: 'Safe deal' },
  },
  { name: 'нода молчит', path: `/barter/${SLOW}`, lang: RU, og: DEFAULTS, within: 5000 },
]

// --- Run -------------------------------------------------------------------

const ENTITIES = { amp: '&', quot: '"', '#039': "'", lt: '<', gt: '>' }
const decode = (s) => s.replace(/&(amp|quot|#039|lt|gt);/g, (_, e) => ENTITIES[e])

function readTags(html) {
  const og = {}
  for (const m of html.matchAll(/<meta property="og:([a-z_]+)" content="([^"]*)">/g)) {
    og[m[1]] = decode(m[2])
  }
  return og
}

function get(port, path, lang) {
  return new Promise((resolve, reject) => {
    const headers = lang ? { 'Accept-Language': lang } : {}
    const started = Date.now()
    const req = http.get({ host: '127.0.0.1', port, path, headers }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => resolve({ status: res.statusCode, body, ms: Date.now() - started }))
    })
    req.on('error', reject)
  })
}

const listen = (server) =>
  new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)))

async function freePort() {
  const probe = http.createServer()
  const port = await listen(probe)
  await new Promise((resolve) => probe.close(resolve))
  return port
}

async function main() {
  if (!existsSync(`${ROOT}/index.php`)) throw new Error(`${ROOT}/index.php not found: pnpm build`)
  const curl = spawnSync(PHP, ['-r', "echo function_exists('curl_init') ? 'yes' : 'no';"], {
    encoding: 'utf8',
  })
  if (curl.error) throw new Error(`PHP not found: ${PHP} (--php <path>)`)
  if (curl.stdout !== 'yes') throw new Error('PHP has no curl extension')
  const version = spawnSync(PHP, ['-r', 'echo PHP_VERSION;'], { encoding: 'utf8' }).stdout

  const nodePort = await listen(node)
  const port = await freePort()
  const php = spawn(PHP, ['-S', `127.0.0.1:${port}`, '-t', ROOT, ROUTER], {
    env: { ...process.env, BARTERON_RPC: `http://127.0.0.1:${nodePort}/` },
    stdio: 'ignore',
  })

  try {
    for (let i = 0; ; i++) {
      try {
        await get(port, '/b_manifest.json', null)
        break
      } catch (error) {
        if (i > 50) throw error
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    const results = {}
    let failed = 0
    for (const c of CASES) {
      const callsBefore = nodeCalls
      const res = await get(port, c.path, c.lang)
      const og = readTags(res.body)
      const problems = []
      if (res.status !== 200) problems.push(`status ${res.status}`)
      if (/(Warning|Notice|Deprecated|Fatal error|Parse error)\b/.test(res.body))
        problems.push('PHP printed an error into the page')
      if (!res.body.includes('<div id="app"></div>')) problems.push('no app container')
      if (!/<script type="module"/.test(res.body)) problems.push('no app script')
      if (/<script>alert|<img src=x/.test(res.body)) problems.push('markup from the node got in')
      for (const [key, want] of Object.entries(c.og)) {
        if (og[key] !== want) problems.push(`og:${key} = ${JSON.stringify(og[key])}`)
      }
      if (c.noNode && nodeCalls !== callsBefore) problems.push('asked the node')
      if (c.within && res.ms > c.within) problems.push(`took ${res.ms} ms`)

      results[c.name] = { status: res.status, ms: res.ms, og, problems }
      if (problems.length) failed++
      if (!JSON_ONLY) {
        console.log(`${problems.length ? '✗' : '✓'} ${c.name}  ${c.path}  (${res.ms} ms)`)
        for (const p of problems) console.log(`    ${p}`)
      }
    }

    const manifest = await get(port, '/b_manifest.json', null)
    const staticOk = manifest.status === 200 && JSON.parse(manifest.body).id
    if (JSON_ONLY) {
      console.log(JSON.stringify(results, null, 2))
    } else {
      console.log(staticOk ? '✓ статика отдаётся файлом' : '✗ b_manifest.json')
      console.log(`PHP ${version}: ${CASES.length - failed} из ${CASES.length} ссылок в порядке`)
      if (failed || !staticOk) process.exitCode = 1
    }
  } finally {
    php.kill()
    node.closeAllConnections()
    node.close()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
