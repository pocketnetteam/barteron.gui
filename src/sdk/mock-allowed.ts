/**
 * The build may use the SDK mock: dev, e2e, unit tests and `build:test`
 * (`VITE_ALLOW_MOCK`). A build-time constant: in a production build every
 * branch behind it is dropped, so no mock code or demo data ships at all
 * (audit, finding 6). The mock never starts inside Bastyon either way: only
 * outside an iframe (`connect`).
 */
export const MOCK_ALLOWED = import.meta.env.VITE_ALLOW_MOCK === 'true'
