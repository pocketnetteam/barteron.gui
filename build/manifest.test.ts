// @vitest-environment node
// Reads public/b_manifest.json from disk: happy-dom's URL has no file: scheme.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { HOST_ORIGINS } from './host-origins'
import type { Plugin } from 'vite'
import {
  devManifest,
  isAllowedOrigin,
  STANDS,
  standIdentity,
  standManifest,
  withIdentity,
} from './manifest'

const production = readFileSync(new URL('../public/b_manifest.json', import.meta.url), 'utf8')

describe('stand copies', () => {
  it('builds for barteron.club without BARTERON_STAND', () => {
    expect(standIdentity(undefined)).toBeNull()
    expect(standIdentity('')).toBeNull()
  })

  it('stops the build on an unknown stand', () => {
    expect(() => standIdentity('prod')).toThrow('BARTERON_STAND: unknown stand "prod", known: test')
    expect(() => standIdentity('toString')).toThrow('unknown stand')
  })

  it('gives the test copy its own id, name and address, the rest stays', () => {
    const test = JSON.parse(withIdentity(production, STANDS.test)) as Record<string, unknown>
    const prod = JSON.parse(production) as Record<string, unknown>
    expect(test).toEqual({
      ...prod,
      id: 'barterontest.app',
      name: 'Barteron (test)',
      scope: 'test.barter.pocketnet.app',
    })
  })

  it('keeps every stand id valid for the node catalog', () => {
    for (const { id } of Object.values(STANDS)) {
      expect(id).toMatch(/^[a-z0-9._]{1,20}$/)
      expect(id).not.toBe(JSON.parse(production).id)
    }
  })
})

describe('dev server CORS for Bastyon hosts', () => {
  it.each([
    'http://localhost:1980',
    'http://127.0.0.1:1980',
    'https://localhost',
    'capacitor://localhost',
    'tauri://localhost',
    'http://tauri.localhost',
    'https://bastyon.com',
    'https://test.pocketnet.app',
  ])('allows %s', (origin) => {
    expect(isAllowedOrigin(origin, HOST_ORIGINS)).toBe(true)
  })

  it.each([
    'https://evil.com',
    'https://localhost.evil.com',
    'http://bastyon.com',
    'https://bastyon.com.evil.com',
    'http://192.168.1.10:1980',
    'https://127.0.0.1.evil.com',
    'https://localhost:1980.evil.com',
    'https://evil.localhost.com',
    'https://a.b.localhost',
    'file://localhost',
    'notcapacitor://localhost',
    'null',
  ])('refuses %s', (origin) => {
    expect(isAllowedOrigin(origin, HOST_ORIGINS)).toBe(false)
  })
})

/** Runs a Vite hook the way Vite would, with `this` set. */
const hook = (plugin: Plugin, name: 'generateBundle' | 'configureServer') => {
  const h = plugin[name] as unknown
  return (typeof h === 'function' ? h : (h as { handler: unknown }).handler) as (
    this: unknown,
    ...args: unknown[]
  ) => unknown
}

describe('stand manifest in the build', () => {
  const emitted = (identity: Parameters<typeof standManifest>[0]) => {
    const files: { fileName: string; source: string }[] = []
    const plugin = standManifest(identity)
    expect(plugin.apply).toBe('build')
    hook(plugin, 'generateBundle').call({ emitFile: (f: (typeof files)[0]) => files.push(f) })
    return files
  }

  it('replaces b_manifest.json for a stand', () => {
    const [file, ...rest] = emitted(STANDS.test)
    expect(rest).toEqual([])
    expect(file!.fileName).toBe('b_manifest.json')
    expect(JSON.parse(file!.source)).toMatchObject({
      id: 'barterontest.app',
      scope: 'test.barter.pocketnet.app',
    })
  })

  it('leaves the production manifest alone without a stand', () => {
    expect(emitted(null)).toEqual([])
  })
})

describe('dev server manifest', () => {
  const serve = (origin?: string) => {
    let path = ''
    let handler: (req: unknown, res: unknown) => void = () => {}
    const plugin = devManifest({
      id: 'barterondev.pocketnet.app',
      name: 'Barteron (dev)',
      allowedOrigins: HOST_ORIGINS,
    })
    expect(plugin.apply).toBe('serve')
    hook(
      plugin,
      'configureServer'
    )({
      middlewares: { use: (p: string, h: typeof handler) => ((path = p), (handler = h)) },
    })
    const headers: Record<string, string> = {}
    let body = ''
    handler(
      { headers: origin ? { origin } : {} },
      { setHeader: (k: string, v: string) => (headers[k] = v), end: (b: string) => (body = b) }
    )
    return { path, headers, manifest: JSON.parse(body) as Record<string, unknown> }
  }

  it('serves its own id and name, never cached', () => {
    const { path, headers, manifest } = serve()
    expect(path).toBe('/b_manifest.json')
    expect(manifest).toEqual({
      ...JSON.parse(production),
      id: 'barterondev.pocketnet.app',
      name: 'Barteron (dev)',
    })
    expect(headers['Cache-Control']).toBe('no-store')
    expect(headers['Content-Type']).toBe('application/json; charset=utf-8')
  })

  it('lets a Bastyon host read it', () => {
    const { headers } = serve('http://localhost:1980')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:1980')
    expect(headers.Vary).toBe('Origin')
  })

  it('does not let another site read it', () => {
    expect(
      serve('https://localhost.evil.com').headers['Access-Control-Allow-Origin']
    ).toBeUndefined()
    expect(serve().headers['Access-Control-Allow-Origin']).toBeUndefined()
  })
})
