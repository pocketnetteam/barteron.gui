// @vitest-environment node
// Reads public/b_manifest.json from disk: happy-dom's URL has no file: scheme.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { HOST_ORIGINS } from './host-origins'
import { isAllowedOrigin, STANDS, standIdentity, withIdentity } from './manifest'

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
  ])('refuses %s', (origin) => {
    expect(isAllowedOrigin(origin, HOST_ORIGINS)).toBe(false)
  })
})
