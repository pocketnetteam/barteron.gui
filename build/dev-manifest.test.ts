import { describe, expect, it } from 'vitest'
import { isAllowedOrigin } from './dev-manifest'
import { HOST_ORIGINS } from './host-origins'

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
