import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The build targets Chrome 89, Firefox 89 and Safari 15 (`vite.config.ts`):
 * the old Bastyon desktop app runs Chromium 89. esbuild lowers JS syntax and
 * adds CSS prefixes, but CSS it cannot lower goes out as it is, and an old
 * engine drops the whole declaration — or the whole rule, for a selector it
 * does not know. These checks keep such CSS out of `src` unless it comes with
 * what the old engines understand. JS methods are checked by ESLint
 * (`eslint.config.js`), the dependencies in `dist` by `build/engines-check.mjs`.
 */
const ROOT = join(__dirname, '..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

/** CSS of every stylesheet and component in `src`, comments stripped. */
const STYLES = walk(join(ROOT, 'src'))
  .filter((path) => /\.(vue|css)$/.test(path))
  .map((path) => {
    const text = readFileSync(path, 'utf8')
    const css = path.endsWith('.vue')
      ? [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
      : text
    return {
      file: relative(ROOT, path).replace(/\\/g, '/'),
      css: css.replace(/\/\*[\s\S]*?\*\//g, ''),
    }
  })
  .filter((s) => s.css.trim())

/** Declarations of the innermost blocks, in order. */
function blocks(css: string): [string, string][][] {
  return [...css.matchAll(/\{([^{}]*)\}/g)].map((m) =>
    m[1]!
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d.includes(':'))
      .map((d) => {
        const i = d.indexOf(':')
        return [d.slice(0, i).trim(), d.slice(i + 1).trim()] as [string, string]
      })
  )
}

/** Values the old engines do not know: the declaration needs one they do before it. */
const NEW_VALUES: [RegExp, string][] = [
  [/color-mix\(/, 'color-mix() — Chrome 111, Safari 16.2'],
  [/light-dark\(/, 'light-dark() — Chrome 123'],
  [/\d(dvh|svh|lvh|dvw|svw|lvw|dvmin|dvmax)\b/, 'dvh/svh/lvh — Chrome 108, Safari 15.4'],
  [/\d(cqw|cqh|cqi|cqb|cqmin|cqmax)\b/, 'container units — Chrome 105'],
  [/\d(r?lh)\b/, 'lh units — Chrome 109'],
]

/** At-rules and syntax the old engines skip whole. */
const NEW_SYNTAX: [RegExp, string][] = [
  [/@container\b/, '@container — Chrome 105'],
  [/@layer\b/, '@layer — Chrome 99, Safari 15.4'],
  [/@scope\b/, '@scope — Chrome 118'],
  [/@starting-style\b/, '@starting-style — Chrome 117'],
  [/@property\b/, '@property — Safari 16.4, Firefox 128'],
  [
    /@media[^{]*\((?:min-|max-)?(?:width|height)\s*[<>]/,
    'media range syntax — Chrome 104, Safari 16.4',
  ],
  [/(^|[;{\s])(translate|rotate|scale)\s*:/, 'translate/rotate/scale properties — Chrome 104'],
  [/[{;]\s*&/, 'CSS nesting — Chrome 112, Safari 16.5'],
]

describe('CSS for the oldest engines', () => {
  it('finds the stylesheets', () => {
    expect(STYLES.length).toBeGreaterThan(100)
  })

  it('newer values come after a fallback for the same property', () => {
    const bad: string[] = []
    for (const { file, css } of STYLES) {
      for (const declarations of blocks(css)) {
        declarations.forEach(([prop, value], i) => {
          const rule = NEW_VALUES.find(([re]) => re.test(value))
          if (!rule) return
          const fallback = declarations
            .slice(0, i)
            .some(([p, v]) => p === prop && !NEW_VALUES.some(([re]) => re.test(v)))
          if (!fallback) bad.push(`${file}: ${prop}: ${value} (${rule[1]})`)
        })
      }
    }
    expect(bad).toEqual([])
  })

  it('no syntax the old engines would skip whole', () => {
    const bad = STYLES.flatMap(({ file, css }) =>
      NEW_SYNTAX.filter(([re]) => re.test(css)).map(([, why]) => `${file}: ${why}`)
    )
    expect(bad).toEqual([])
  })

  it(':has() comes with a rule for engines without it (Chrome 105, Safari 15.4, Firefox 121)', () => {
    const bad = STYLES.filter(
      ({ css }) => css.includes(':has(') && !css.includes('@supports not selector(:has(')
    ).map(({ file }) => file)
    expect(bad).toEqual([])
  })

  it('a strip without a scrollbar hides it in WebKit too (scrollbar-width: Chrome 121, Safari 18.2)', () => {
    const bad = STYLES.flatMap(({ file, css }) =>
      [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter((m) => /scrollbar-width:\s*none/.test(m[2]!))
        .flatMap((m) => m[1]!.split(',').map((s) => s.trim()))
        .filter((selector) => !css.includes(`${selector}::-webkit-scrollbar`))
        .map((selector) => `${file}: ${selector}`)
    )
    expect(bad).toEqual([])
  })
})
