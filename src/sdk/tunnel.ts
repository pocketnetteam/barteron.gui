import type { HostSdk } from './types'

/** The fetch tunnel of the Bastyon hosts, `public/miniapp-service-worker.js`. */
export const TUNNEL_SCRIPT = '/miniapp-service-worker.js'

type Registrations = Pick<ServiceWorkerContainer, 'getRegistrations'>

/**
 * Outside services through the host while it routes traffic through Tor
 * (`appinfo.alttransport`; sdk.js registers the worker itself). With Tor off
 * a worker left from an earlier visit is removed: it would still send every
 * outside request to the host, and bastyon-nextgen refuses those not on the
 * app's `fetchHosts` with or without Tor (`core/fetch-tunnel.ts`). The page it
 * already controls stays so until the next start.
 */
export async function syncTunnel(
  sdk: HostSdk,
  alttransport: boolean,
  container: Registrations | undefined = globalThis.navigator?.serviceWorker
): Promise<void> {
  if (alttransport) {
    await sdk.serviceWorker?.register().catch(() => null)
    return
  }
  const registrations = await container?.getRegistrations().catch(() => [])
  for (const registration of registrations ?? []) {
    const worker = registration.active ?? registration.waiting ?? registration.installing
    if (worker && new URL(worker.scriptURL).pathname === TUNNEL_SCRIPT) {
      await registration.unregister().catch(() => false)
    }
  }
}
