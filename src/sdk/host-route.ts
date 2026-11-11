/**
 * Where the host wants the app to go. The previous Bastyon sends
 * `changestate` with `{route: 'barter/<id>'}` when its address changes while
 * the app is open — a Barteron link opened from a chat, for one — and the old
 * app followed it (`App.vue`, `sdk.on('changestate')` → `getroute`).
 * bastyon-nextgen sends `{path}` with its own address on every page change
 * and reloads the frame for a new app path, so `path` is not followed.
 */
export function routeFromHost(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const route = (data as { route?: unknown }).route
  if (typeof route !== 'string') return null
  return `/${route.trim().replace(/^\/+/, '')}`
}
