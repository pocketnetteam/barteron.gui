/**
 * Guard for the oldest engines the build targets (vite.config.ts, `OLDEST_ENGINES`:
 * Safari 15, Chromium 89). The app's `lib` is ES2020, so methods newer than that
 * do not type-check, and esbuild does not add them at build time.
 *
 * That only holds while no package's types bring Node's globals into the app:
 * vitest 3 did, and `Array.prototype.at` slipped into the catalog unnoticed
 * (audit, finding 65). If it happens again, the lines below stop being errors,
 * and typecheck fails on the unused `@ts-expect-error`.
 *
 * Types only: nothing here reaches the build.
 */

// @ts-expect-error Array.prototype.at is ES2022: Safari 15.4, Chromium 92.
export type ArrayAt = ReturnType<number[]['at']>

// @ts-expect-error Object.hasOwn is ES2022: Safari 15.4, Chromium 93.
export type HasOwn = ReturnType<ObjectConstructor['hasOwn']>

// @ts-expect-error Node's modules are not in the browser.
export type NodeFs = typeof import('node:fs')
