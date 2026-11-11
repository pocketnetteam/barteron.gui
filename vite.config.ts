import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import basicSsl from '@vitejs/plugin-basic-ssl'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { devManifest } from './build/dev-manifest'
import { HOST_ORIGINS } from './build/host-origins'
import { indexPhp } from './build/index-php'

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
    // `pnpm dev:https`: the CSP of bastyon-nextgen's web build (index.html) allows
    // only https frames and requests, so a sideloaded dev server must be https.
    // The old app ran its dev server on https as well.
    mode === 'https' && basicSsl({ name: 'barteron-dev', domains: ['localhost'] }),
    // barteron.club serves index.php: the page plus link-preview tags (php/og.php).
    indexPhp(),
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
    setupFiles: ['src/test/setup.ts'],
  },
}))
