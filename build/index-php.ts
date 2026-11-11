import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

/** PHP files next to index.php: the link previews. */
const PHP_FILES = ['og.php', 'rpc.php'] as const

/**
 * Where the old server reaches the node (barteron.gui/public/index.php).
 * `BARTERON_RPC` overrides it for a local check (build/og-check.mjs).
 */
const DEFAULT_RPC = 'http://proxy:8898/'

const PROLOGUE = `<?php
// Made by build/index-php.ts from index.html: the app page with link-preview tags (og.php).
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
$barteronOg = '';
try {
    require_once __DIR__ . '/og.php';
    $barteronOg = OG::forRequest(getenv('BARTERON_RPC') ?: '${DEFAULT_RPC}', $_SERVER);
} catch (Throwable $e) {
    error_log('Barteron link preview: ' . $e->getMessage());
}
?>
`

/**
 * index.html → index.php: the page itself stays the same, PHP adds the
 * link-preview tags at the end of <head>.
 */
export function toIndexPhp(html: string): string {
  // A short open tag would start PHP in the middle of the page.
  if (html.includes('<?')) throw new Error('index.html contains "<?", PHP would run it')
  const head = html.indexOf('</head>')
  if (head < 0) throw new Error('index.html has no </head>')
  return `${PROLOGUE}${html.slice(0, head)}  <?php echo $barteronOg; ?>\n  ${html.slice(head)}`
}

/**
 * Ships the app page as index.php, like the old app (vue.config.js:
 * `indexPath: "index.php"`): the server already runs it for every path,
 * so its config stays the same. There is no index.html in dist.
 */
export function indexPhp(): Plugin {
  return {
    name: 'barteron:index-php',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const page = bundle['index.html']
      if (!page || page.type !== 'asset') this.error('index.html is not in the bundle')
      const html =
        typeof page.source === 'string' ? page.source : new TextDecoder().decode(page.source)
      delete bundle['index.html']
      this.emitFile({ type: 'asset', fileName: 'index.php', source: toIndexPhp(html) })
      for (const file of PHP_FILES) {
        const source = readFileSync(new URL(`../php/${file}`, import.meta.url), 'utf8')
        this.emitFile({ type: 'asset', fileName: file, source })
      }
    },
  }
}
