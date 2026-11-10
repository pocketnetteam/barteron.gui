/** Bastyon hosts that may fetch the manifest and icon from the dev server. */
export const HOST_ORIGINS: readonly (string | RegExp)[] = [
  // bastyon-nextgen dev server, Tauri and Capacitor shells
  /^(https?|tauri|capacitor):\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  // previous Bastyon
  'https://bastyon.com',
  'https://test.pocketnet.app',
]
