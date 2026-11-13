import { describe, expect, it } from 'vitest'
import { toIndexPhp } from './index-php'

const HTML = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Barteron</title>
    <script type="module" crossorigin src="/assets/index-abc.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
`

describe('index.php', () => {
  it('keeps the page and adds the preview tags at the end of <head>', () => {
    const php = toIndexPhp(HTML)
    expect(php.startsWith('<?php')).toBe(true)
    // Before anything runs: PHP without a php.ini would print errors into the page.
    const prologue = php.slice(0, php.indexOf('?>'))
    expect(prologue.indexOf("ini_set('display_errors', '0');")).toBeGreaterThan(0)
    expect(prologue.indexOf("ini_set('display_errors', '0');")).toBeLessThan(
      prologue.indexOf('require_once')
    )
    expect(prologue).toContain("header('Content-Type: text/html; charset=utf-8');")
    expect(prologue).toContain("header('Cache-Control: no-cache');")
    expect(php).toContain("require_once __DIR__ . '/og.php'")
    expect(php).toContain("getenv('BARTERON_RPC') ?: 'http://proxy:8898/'")
    // Tags go after the scripts and before </head>.
    expect(php).toMatch(/index-abc\.js"><\/script>\s*<\?php echo \$barteronOg; \?>\s*<\/head>/)
    // Everything else is untouched.
    const page = php
      .slice(php.indexOf('<!doctype html>'))
      .replace(/ {2}<\?php echo[^\n]*\n {2}/, '')
    expect(page).toBe(HTML)
  })

  it('refuses a page PHP would misread', () => {
    expect(() => toIndexPhp(HTML.replace('<body>', '<body><?xml'))).toThrow('<?')
    expect(() => toIndexPhp('<html><body></body></html>')).toThrow('</head>')
  })
})
