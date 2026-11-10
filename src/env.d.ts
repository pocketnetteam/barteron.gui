/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Bastyon host that serves `/js/lib/apps/sdk.js`. */
  readonly VITE_SDK_HOST: string
  /** `'true'` — use the mock SDK when the app is opened outside Bastyon. */
  readonly VITE_ALLOW_MOCK: string
  /** `'true'` — the design system showcase at /dev/ui. */
  readonly VITE_SHOWCASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
