/**
 * The anonymous survey on `p2p.back.pocketnet.app/barteron/survey`, the same
 * requests as the old app (barteron.gui `src/js/sdk.js`, `getSurveyData` and
 * `setSurveyData`): plain JSON POSTs, not signed.
 *
 * - `check` `{address}` → `{result: 'success', status}`; no status means `new`;
 * - `form` `{address, answer1, answer2, email?, status: 'completed'}` — the
 *   answers; `{address, status: 'rejected'}` — the user closed the invitation.
 */

import { isJsonObject, str } from '@/models/tx'
import { NOTIFY_API, postJson } from './notify'

export const SURVEY_API = `${NOTIFY_API}/survey`

/** `new` — not answered yet: the home page may invite. */
export type SurveyStatus = 'new' | 'completed' | 'rejected'

export interface SurveyAnswers {
  answer1: string
  answer2: string
  email: string
}

export interface SurveyService {
  status(address: string): Promise<SurveyStatus>
  send(address: string, answers: SurveyAnswers): Promise<void>
  reject(address: string): Promise<void>
}

export class SurveyError extends Error {}

/** `{result: 'success', status}` from `check`. */
export function parseSurveyStatus(value: unknown): SurveyStatus {
  if (!isJsonObject(value) || str(value.result).toLowerCase() !== 'success') {
    throw new SurveyError('Survey check request failed')
  }
  const status = str(value.status) || 'new'
  return status === 'completed' || status === 'rejected' ? status : 'new'
}

/** At least one answer, the old form's rule; the e-mail is optional but must look like one. */
export function surveyProblem(answers: SurveyAnswers): 'empty' | 'email' | null {
  if (!answers.answer1.trim() && !answers.answer2.trim()) return 'empty'
  const email = answers.email.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'email'
  return null
}

export function createSurveyService(fetcher: typeof fetch): SurveyService {
  /** The answer's JSON, `null` if not JSON; no answer in 15 s is a survey error too. */
  async function post(path: string, body: unknown): Promise<unknown> {
    try {
      const { result } = await postJson(fetcher, `${SURVEY_API}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(body),
      })
      return result
    } catch (e) {
      throw new SurveyError(e instanceof Error ? e.message : String(e))
    }
  }

  async function form(body: Record<string, string>): Promise<void> {
    const result = await post('form', body)
    if (!isJsonObject(result) || str(result.result).toLowerCase() !== 'success') {
      throw new SurveyError('Survey data request failed')
    }
  }

  return {
    async status(address) {
      return parseSurveyStatus(await post('check', { address }))
    },
    async send(address, answers) {
      const body: Record<string, string> = {
        answer1: answers.answer1.trim(),
        answer2: answers.answer2.trim(),
        address,
        status: 'completed',
      }
      const email = answers.email.trim()
      if (email) body.email = email
      await form(body)
    },
    async reject(address) {
      await form({ address, status: 'rejected' })
    },
  }
}
