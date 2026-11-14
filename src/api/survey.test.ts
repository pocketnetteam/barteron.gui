import { describe, expect, it, vi } from 'vitest'
import {
  createSurveyService,
  parseSurveyStatus,
  SURVEY_API,
  SurveyError,
  surveyProblem,
} from './survey'

describe('survey on p2p.back', () => {
  it('reads `check` as the old app did: no status means new', () => {
    expect(parseSurveyStatus({ result: 'success' })).toBe('new')
    expect(parseSurveyStatus({ result: 'Success', status: 'completed' })).toBe('completed')
    expect(parseSurveyStatus({ result: 'success', status: 'rejected' })).toBe('rejected')
    expect(() => parseSurveyStatus({ result: 'error' })).toThrow()
    expect(() => parseSurveyStatus(null)).toThrow()
  })

  it('wants one answer at least and a real-looking e-mail if any', () => {
    expect(surveyProblem({ answer1: ' ', answer2: '', email: '' })).toBe('empty')
    expect(surveyProblem({ answer1: '', answer2: 'Карта', email: '' })).toBeNull()
    expect(surveyProblem({ answer1: 'Поиск', answer2: '', email: 'me@' })).toBe('email')
    expect(surveyProblem({ answer1: 'Поиск', answer2: '', email: 'me@mail.ru' })).toBeNull()
  })

  it('sends the same JSON as the old `setSurveyData`, unsigned', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ result: 'success' })))
    const service = createSurveyService(fetcher as unknown as typeof fetch)

    await service.send('PAddr', { answer1: ' Поиск ', answer2: '', email: '' })
    await service.reject('PAddr')

    const calls = fetcher.mock.calls as unknown as [string, RequestInit][]
    expect(calls[0]![0]).toBe(`${SURVEY_API}/form`)
    expect(JSON.parse(String(calls[0]![1].body))).toEqual({
      answer1: 'Поиск',
      answer2: '',
      address: 'PAddr',
      status: 'completed',
    })
    expect(calls[0]![1].headers).not.toHaveProperty('Signature')
    expect(JSON.parse(String(calls[1]![1].body))).toEqual({ address: 'PAddr', status: 'rejected' })
  })

  it('out of reach: no answer in 15 s, a network failure or not JSON is a survey error', async () => {
    vi.useFakeTimers()
    try {
      const hanging = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) =>
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('', 'AbortError'))
            )
          )
      )
      const result = createSurveyService(hanging as unknown as typeof fetch)
        .status('P')
        .catch((e: unknown) => e)
      await vi.advanceTimersByTimeAsync(15_000)
      expect(await result).toBeInstanceOf(SurveyError)
    } finally {
      vi.useRealTimers()
    }
    const refused = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(
      createSurveyService(refused as unknown as typeof fetch).status('P')
    ).rejects.toBeInstanceOf(SurveyError)
    const html = vi.fn(async () => new Response('<html>502</html>', { status: 502 }))
    await expect(
      createSurveyService(html as unknown as typeof fetch).status('P')
    ).rejects.toBeInstanceOf(SurveyError)
  })

  it('fails when the service does not say success', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ result: 'error' })))
    const service = createSurveyService(fetcher as unknown as typeof fetch)
    await expect(service.send('P', { answer1: 'a', answer2: '', email: '' })).rejects.toThrow()
  })
})
