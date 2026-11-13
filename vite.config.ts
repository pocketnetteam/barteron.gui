import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import basicSsl from '@vitejs/plugin-basic-ssl'
import vue from '@vitejs/plugin-vue'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { HOST_ORIGINS } from './build/host-origins'
import { indexPhp } from './build/index-php'
import { devManifest, standIdentity, standManifest } from './build/manifest'
import { noMock } from './build/no-mock'

/** Shown in the settings. */
const APP_VERSION = (
  JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string
  }
).version

/**
 * Oldest engines we build for — the same as bastyon-nextgen (Safari 15,
 * Chromium 89). Barteron runs inside the host's WebView, so it cannot need
 * a newer engine than the host itself.
 */
const OLDEST_ENGINES = ['chrome89', 'edge89', 'firefox89', 'safari15', 'ios15']

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    devManifest({
      id: 'barterondev.pocketnet.app',
      name: 'Barteron (dev)',
      allowedOrigins: HOST_ORIGINS,
    }),
    // BARTERON_STAND=test: the copy for test.barter.pocketnet.app with its own id.
    standManifest(standIdentity(process.env.BARTERON_STAND)),
    // `pnpm dev:https`: the CSP of bastyon-nextgen's web build (index.html) allows
    // only https frames and requests, so a sideloaded dev server must be https.
    // The old app ran its dev server on https as well.
    mode === 'https' && basicSsl({ name: 'barteron-dev', domains: ['localhost'] }),
    // barteron.club serves index.php: the page plus link-preview tags (php/og.php).
    indexPhp(),
    // No SDK mock in a build that does not allow it (both deploys).
    noMock(loadEnv(mode, process.cwd(), 'VITE_').VITE_ALLOW_MOCK !== 'true'),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    // vue-i18n build flags: Composition API only, no devtools in production.
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    cors: { origin: [...HOST_ORIGINS] },
  },
  preview: {
    port: 5180,
    strictPort: true,
  },
  build: {
    target: OLDEST_ENGINES,
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'build/**/*.test.ts'],
    restoreMocks: true,
    // The first test of a file waits for the app's modules to transform: on a
    // busy machine, or under --coverage, that alone takes more than 5 s.
    testTimeout: 15_000,
    setupFiles: ['src/test/setup.ts'],
    // `pnpm test:coverage`: the report the code audit (AUDIT.md) works from.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}', 'build/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts', 'src/test/**', 'src/i18n/locales/**', 'src/data/**'],
      reporter: ['text-summary', 'json-summary', 'json', 'html'],
    },
  },
}))
