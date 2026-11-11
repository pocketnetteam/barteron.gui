/**
 * The survey on p2p.back for the SDK mock: statuses in memory, nothing leaves
 * the browser. An answer starting with `!error` is refused, to try the
 * failure by hand.
 */

import {
  SurveyError,
  type SurveyAnswers,
  type SurveyService,
  type SurveyStatus,
} from '@/api/survey'

export interface MockSurvey extends SurveyService {
  /** What was «sent», newest last: for tests. */
  readonly sent: ({ address: string; status: SurveyStatus } & Partial<SurveyAnswers>)[]
}

export function createMockSurvey(delayMs = 300): MockSurvey {
  const statuses = new Map<string, SurveyStatus>()
  const sent: MockSurvey['sent'] = []
  const wait = () => new Promise((resolve) => setTimeout(resolve, delayMs))

  return {
    sent,
    async status(address) {
      await wait()
      return statuses.get(address) ?? 'new'
    },
    async send(address, answers) {
      await wait()
      if (answers.answer1.startsWith('!error') || answers.answer2.startsWith('!error')) {
        throw new SurveyError('Survey data request failed')
      }
      statuses.set(address, 'completed')
      sent.push({ address, status: 'completed', ...answers })
    },
    async reject(address) {
      await wait()
      statuses.set(address, 'rejected')
      sent.push({ address, status: 'rejected' })
    },
  }
}
