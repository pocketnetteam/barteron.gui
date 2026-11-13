import type { Plugin } from 'vite'

/**
 * Strings only the SDK mock and its demo data carry, and a minifier keeps:
 * the e2e handles on `window`, the mock user and the demo sellers.
 */
export const MOCK_MARKERS = [
  '__barteronMock',
  '__barteronSurvey',
  '__barteronNotify',
  'PMockUser',
  'PDemo',
]

/** Which chunks still carry the mock, as `file: marker`. */
export function mockLeftovers(chunks: { fileName: string; code: string }[]): string[] {
  return chunks.flatMap((c) =>
    MOCK_MARKERS.filter((m) => c.code.includes(m)).map((m) => `${c.fileName}: ${m}`)
  )
}

/**
 * A build without the mock (`VITE_ALLOW_MOCK` not `true`: both deploys) fails
 * if any chunk still has it (audit, finding 6). Every mock branch sits behind
 * `MOCK_ALLOWED` (`src/sdk/mock-allowed.ts`); this keeps it that way.
 */
export function noMock(check: boolean): Plugin {
  return {
    name: 'barteron-no-mock',
    apply: 'build',
    generateBundle(_, bundle) {
      if (!check) return
      const chunks = Object.values(bundle).flatMap((f) => (f.type === 'chunk' ? [f] : []))
      const found = mockLeftovers(chunks)
      if (found.length) this.error(`The SDK mock got into the build: ${found.join(', ')}`)
    },
  }
}
