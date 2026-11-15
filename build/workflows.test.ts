// @vitest-environment node
// The deploy workflows run on our own runners, one of them on the production
// server, in a public repository. These checks keep the safety settings in place.
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STANDS } from './manifest'

const DIR = new URL('../.github/workflows/', import.meta.url)
const files = readdirSync(DIR).filter((name) => name.endsWith('.yml'))
const read = (name: string) => readFileSync(new URL(name, DIR), 'utf8').replace(/\r\n/g, '\n')
/** The lines of a workflow without comments. */
const code = (name: string) =>
  read(name)
    .split('\n')
    .map((line) => line.replace(/(^|\s)#.*$/, ''))
    .join('\n')
/** The block under a top-level key, up to the next top-level key, without blank lines at the end. */
const block = (text: string, key: string) =>
  new RegExp(`^${key}:\\n((?:[ \\t].*\\n|\\n)*)`, 'm')
    .exec(`${text}\n`)?.[1]
    ?.replace(/\n+$/, '\n') ?? null

describe('deploy workflows', () => {
  it('are the two of them: production and the test stand', () => {
    expect(files.sort()).toEqual(['barteron.club.yml', 'test.barter.pocketnet.app.yml'])
  })

  describe.each(files)('%s', (name) => {
    const text = code(name)

    it('start only by hand or by a push, never from a pull request', () => {
      const on = block(text, 'on') ?? ''
      expect(on).toMatch(/^ {2}workflow_dispatch:/m)
      const triggers = [...on.matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1])
      expect(triggers.every((t) => t === 'workflow_dispatch' || t === 'push')).toBe(true)
      expect(text).not.toMatch(/pull_request|workflow_run|issue_comment/)
    })

    it('give the job token read access only', () => {
      expect(block(text, 'permissions')).toBe('  contents: read\n')
      // No job widens it again.
      expect(text).not.toMatch(/^[ \t]+permissions:/m)
    })

    it('pin every action to a commit', () => {
      const uses = [...text.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1])
      expect(uses.length).toBeGreaterThan(0)
      for (const action of uses) expect(action).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/)
    })

    it('do not leave the token in .git for the build', () => {
      // Every checkout, not just one of them.
      const checkouts = text.match(/uses: actions\/checkout@/g) ?? []
      const safe =
        text.match(/uses: actions\/checkout@\w+\n\s+with:\n\s+persist-credentials: false\n/g) ?? []
      expect(checkouts.length).toBeGreaterThan(0)
      expect(safe).toHaveLength(checkouts.length)
    })

    it('run one at a time and stop if stuck', () => {
      expect(block(text, 'concurrency')).toMatch(/^ {2}group: \S+\n$/)
      expect(text).not.toMatch(/cancel-in-progress:\s*true/)
      // Every job: a key two spaces in under `jobs:`.
      const jobs = block(text, 'jobs')?.match(/^ {2}[\w-]+:$/gm) ?? []
      const timeouts = text.match(/^ {4}timeout-minutes: \d+$/gm) ?? []
      expect(jobs.length).toBeGreaterThan(0)
      expect(timeouts).toHaveLength(jobs.length)
    })

    it('check and build from the lockfile before copying', () => {
      const install = text.indexOf('pnpm install --frozen-lockfile')
      const check = text.indexOf('pnpm check')
      const build = text.indexOf('pnpm build')
      const copy = text.indexOf('rsync')
      expect(install).toBeGreaterThan(0)
      expect(install < check && check < build && build < copy).toBe(true)
    })

    it('copy dist to a fixed folder, without --delete and without variables', () => {
      const copies = [...text.matchAll(/^\s+run: rsync (.+)$/gm)].map((m) => m[1])
      expect(copies).toHaveLength(1)
      expect(copies[0]).toMatch(/^-ah \.\/dist\/ \/[\w/.-]+\/$/)
      expect(text).not.toMatch(/rm -rf/)
    })

    it('use no secrets', () => {
      expect(text).not.toMatch(/secrets\.|\$\{\{\s*github\.token/)
    })
  })

  describe('production', () => {
    const text = code('barteron.club.yml')

    it('runs only from the branch a push starts it from, even by hand', () => {
      const pushed = /push:\n\s+branches:\n\s+- (\S+)\n/.exec(text)?.[1]
      const allowed = /if: github\.ref == 'refs\/heads\/(\S+)'/.exec(text)?.[1]
      expect(pushed).toBeTruthy()
      expect(allowed).toBe(pushed)
    })

    it('keeps a copy of the current version before copying the new one', () => {
      const keep = text.indexOf('cp -a /data/barteron "$backup"')
      expect(keep).toBeGreaterThan(0)
      expect(keep).toBeLessThan(text.indexOf('rsync -ah ./dist/ /data/barteron/'))
    })
  })

  describe('test stand', () => {
    const text = code('test.barter.pocketnet.app.yml')

    it('starts only by hand: the old app may still live there', () => {
      expect(block(text, 'on')).toBe('  workflow_dispatch:\n')
    })

    it('builds a known stand copy with its own id', () => {
      const stand = /BARTERON_STAND: (\S+)/.exec(text)?.[1]
      expect(stand).toBe('test')
      expect(Object.keys(STANDS)).toContain(stand)
    })
  })
})
