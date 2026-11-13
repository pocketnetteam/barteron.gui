import { describe, expect, it } from 'vitest'
import { mockLeftovers, noMock } from './no-mock'

describe('no SDK mock in a deploy build', () => {
  it('finds the mock’s strings in a chunk', () => {
    expect(
      mockLeftovers([
        { fileName: 'index.js', code: 'const a=1;window.__barteronMock=b' },
        { fileName: 'mock-data.js', code: 'address:"PMockUser1111"' },
        { fileName: 'deal.js', code: 'const ok=true' },
      ])
    ).toEqual(['index.js: __barteronMock', 'mock-data.js: PMockUser'])
  })

  it('fails the build that must not have it, lets the one that may', () => {
    const run = (check: boolean, code: string) => {
      const errors: string[] = []
      const plugin = noMock(check)
      const hook = plugin.generateBundle as (
        this: { error: (m: string) => void },
        o: unknown,
        b: unknown
      ) => void
      hook.call(
        { error: (m) => errors.push(m) },
        {},
        {
          'a.js': { type: 'chunk', fileName: 'a.js', code },
          'a.css': { type: 'asset', fileName: 'a.css', source: 'PMockUser' },
        }
      )
      return errors
    }
    expect(run(true, 'x=window.__barteronSurvey')).toEqual([
      'The SDK mock got into the build: a.js: __barteronSurvey',
    ])
    expect(run(true, 'x=1')).toEqual([])
    expect(run(false, 'x=window.__barteronSurvey')).toEqual([])
  })
})
