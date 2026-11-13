import type { Router } from 'vue-router'
import type { HostSdk } from './types'

/**
 * Where the host wants the app to go. The previous Bastyon sends
 * `changestate` with `{route: 'barter/<id>'}` when its address changes while
 * the app is open — a Barteron link opened from a chat, for one — and the old
 * app followed it (`App.vue`, `sdk.on('changestate')` → `getroute`).
 * bastyon-nextgen sends `{path}` with its own address on every page change
 * and reloads the frame for a new app path, so `path` is not followed.
 *
 * The route is the `p` of a Bastyon link, so anyone can make it: it is
 * always a path inside the app. A screen it opens only shows; every write
 * there waits for the user's press (audit, stage 9).
 */
export function routeFromHost(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const route = (data as { route?: unknown }).route
  if (typeof route !== 'string') return null
  // `\` reads as `/` in a URL: `/\host` would be `//host`.
  return `/${route.trim().replace(/^[/\\]+/, '')}`
}

/** Follows the host's `changestate` (see `routeFromHost`). */
export function followHostRoutes(sdk: Pick<HostSdk, 'on'>, router: Router): void {
  sdk.on('changestate', (data) => {
    const target = routeFromHost(data)
    if (target && target !== router.currentRoute.value.fullPath) void router.push(target)
  })
}
