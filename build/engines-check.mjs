// The built app against the oldest engines (Chrome 89, Firefox 89, Safari 15):
// methods and CSS the dependencies may bring in. Our own code is held by ESLint
// and build/engines.test.ts; this looks at `dist` after `pnpm build`, for
// instance after updating a dependency. Nothing leaves the machine.
//
//   pnpm build && node build/engines-check.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = join(import.meta.dirname, '..', 'dist', 'assets')

const JS = [
  [/\.(at|findLast|findLastIndex|toSorted|toReversed|toSpliced)\(/g, 'Chrome 92–110'],
  [/\bObject\.(hasOwn|groupBy)\b/g, 'Chrome 93–117'],
  [/\bstructuredClone\(/g, 'Chrome 98'],
  [/\bAbortSignal\.(timeout|any)\b/g, 'Chrome 103, Safari 16'],
  [/\bArray\.fromAsync\b|\bPromise\.withResolvers\b/g, 'Chrome 119–121'],
  [/\bcrypto\.randomUUID\(/g, 'Chrome 92, Safari 15.4'],
]
const CSS = [
  [/color-mix\(/g, 'Chrome 111'],
  [/:has\(/g, 'Chrome 105, Safari 15.4'],
  [/@container\b|@layer\b|@scope\b/g, 'Chrome 99–118'],
  [/\d(dvh|svh|lvh)\b/g, 'Chrome 108'],
]

/**
 * Known and harmless: Vue's reactive arrays define `toSorted() { return
 * raw(this).toSorted() }` and so on, run only when the app calls them; hls.js
 * calls `crypto.randomUUID()` inside `try` with a fallback. In CSS, a newer
 * value right after a fallback for the same property, and `:has()` next to
 * an `@supports not selector(:has(*))` rule, as build/engines.test.ts asks.
 */
function harmless(text, index, match) {
  const before = text.slice(Math.max(0, index - 300), index)
  const name = match.replace(/^\./, '').replace(/\($/, '')
  if (new RegExp(`${name}\\([^)]*\\)\\{return [\\w$]+\\(this\\)$`).test(before)) return true
  if (name.startsWith('crypto.randomUUID') && /try\{return $/.test(before)) return true
  if (match === 'color-mix(' || /\d[dsl]vh$/.test(match)) {
    // The declarations before this one in the same block.
    const head = before.slice(0, before.lastIndexOf(';'))
    const block = head.slice(head.lastIndexOf('{') + 1)
    const decl = before.slice(before.lastIndexOf(';') + 1)
    const prop = decl.slice(0, decl.indexOf(':')).trim()
    return !!prop && new RegExp(`(^|;)${prop}:`).test(block)
  }
  if (match === ':has(') return text.includes('@supports not selector(:has(*))')
  return false
}

const found = []
for (const file of readdirSync(DIST)) {
  const checks = file.endsWith('.js') ? JS : file.endsWith('.css') ? CSS : null
  if (!checks) continue
  const text = readFileSync(join(DIST, file), 'utf8')
  for (const [re, why] of checks) {
    for (const m of text.matchAll(re)) {
      if (harmless(text, m.index, m[0])) continue
      found.push(
        `${file}: ${m[0]} (${why}) …${text.slice(Math.max(0, m.index - 60), m.index + 40)}…`
      )
    }
  }
}

if (found.length) {
  console.log(found.join('\n'))
  process.exitCode = 1
} else {
  console.log('ok: nothing newer than Chrome 89 / Safari 15 found in dist')
}
