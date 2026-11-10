import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

export interface DevManifestOptions {
  /** Manifest id served by the dev server. */
  id: string
  /** Name shown by the host. */
  name: string
  /** Origins allowed to fetch the manifest (the Bastyon hosts). */
  allowedOrigins: readonly (string | RegExp)[]
}

/**
 * Serves `b_manifest.json` in dev with a separate id.
 *
 * The new Bastyon refuses to sideload a built-in id (`barteron.pocketnet.app`)
 * from any origin except `barteron.club`, so the dev server has to present
 * itself as a different app. The static file in `public/` stays the production
 * manifest and is what `vite build` ships.
 *
 * Plugin middlewares run before Vite's own CORS middleware, so the CORS header
 * is set here.
 */
export function devManifest(options: DevManifestOptions): Plugin {
  return {
    name: 'barteron:dev-manifest',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/b_manifest.json', (req, res) => {
        const file = new URL('../public/b_manifest.json', import.meta.url)
        const manifest = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
        manifest.id = options.id
        manifest.name = options.name

        const origin = req.headers.origin
        if (origin && isAllowedOrigin(origin, options.allowedOrigins)) {
          res.setHeader('Access-Control-Allow-Origin', origin)
          res.setHeader('Vary', 'Origin')
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(manifest, null, 2))
      })
    },
  }
}

export function isAllowedOrigin(origin: string, allowed: readonly (string | RegExp)[]): boolean {
  return allowed.some((rule) => (typeof rule === 'string' ? rule === origin : rule.test(origin)))
}
