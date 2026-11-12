import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

/** How a copy of the app introduces itself to Bastyon in `b_manifest.json`. */
export interface ManifestIdentity {
  /** Manifest id. Each copy needs its own: the host keys apps by it. */
  id: string
  /** Name the host shows in its app list and window. */
  name: string
  /** Address the copy is served from, without `https://`. */
  scope?: string
}

/**
 * Copies of the app besides barteron.club, chosen with `BARTERON_STAND` at build
 * time. Both Bastyon hosts have `barteron.pocketnet.app` built in with the address
 * barteron.club, and the new one refuses that id from any other address. So a copy
 * on another address presents its own id and is opened through «Для разработчиков».
 *
 * The test id is short enough for the node (20 characters: letters, digits, `.`
 * and `_`), in case the copy is ever registered in the network's app catalog.
 */
export const STANDS = {
  test: { id: 'barterontest.app', name: 'Barteron (test)', scope: 'test.barter.pocketnet.app' },
} as const satisfies Record<string, ManifestIdentity>

export type Stand = keyof typeof STANDS

/** The copy named by `BARTERON_STAND`; `null` (barteron.club) when it is empty. */
export function standIdentity(value: string | undefined): ManifestIdentity | null {
  if (!value) return null
  if (!Object.hasOwn(STANDS, value)) {
    const known = Object.keys(STANDS).join(', ')
    throw new Error(`BARTERON_STAND: unknown stand "${value}", known: ${known}`)
  }
  return STANDS[value as Stand]
}

/** The production manifest with another id, name and, if given, address. */
export function withIdentity(manifest: string, identity: ManifestIdentity): string {
  const data = JSON.parse(manifest) as Record<string, unknown>
  data.id = identity.id
  data.name = identity.name
  if (identity.scope) data.scope = identity.scope
  return `${JSON.stringify(data, null, 2)}\n`
}

const readManifest = () =>
  readFileSync(new URL('../public/b_manifest.json', import.meta.url), 'utf8')

/**
 * Ships `b_manifest.json` of a stand copy instead of the production one from
 * `public/`. Emitted files are written after `public/` is copied, so this one
 * replaces it. Without a stand the build is left alone.
 */
export function standManifest(identity: ManifestIdentity | null): Plugin {
  return {
    name: 'barteron:stand-manifest',
    apply: 'build',
    generateBundle() {
      if (!identity) return
      this.emitFile({
        type: 'asset',
        fileName: 'b_manifest.json',
        source: withIdentity(readManifest(), identity),
      })
    },
  }
}

export interface DevManifestOptions extends ManifestIdentity {
  /** Origins allowed to fetch the manifest (the Bastyon hosts). */
  allowedOrigins: readonly (string | RegExp)[]
}

/**
 * Serves `b_manifest.json` in dev with a separate id, for the same reason as
 * a stand copy: the new Bastyon refuses the built-in id from localhost.
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
        const origin = req.headers.origin
        if (origin && isAllowedOrigin(origin, options.allowedOrigins)) {
          res.setHeader('Access-Control-Allow-Origin', origin)
          res.setHeader('Vary', 'Origin')
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(withIdentity(readManifest(), { id: options.id, name: options.name }))
      })
    },
  }
}

export function isAllowedOrigin(origin: string, allowed: readonly (string | RegExp)[]): boolean {
  return allowed.some((rule) => (typeof rule === 'string' ? rule === origin : rule.test(origin)))
}
