import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  createSurveyService,
  type SurveyAnswers,
  type SurveyService,
  type SurveyStatus,
} from '@/api/survey'
import { banListLoaded, hangIfBanned, isBanned, loadBanList } from '@/config/ban'
import { MOCK_ALLOWED } from '@/sdk/mock-allowed'
import { createMockSurvey, type MockSurvey } from '@/sdk/mock-survey'
import type { ConnectMode } from '@/sdk/connect'
import type { HostSdk } from '@/sdk/types'
import { useSessionStore } from '@/stores/session'

/** The old app invited after ten minutes in the app (`surveyDisplayInterval`). */
export const SURVEY_DELAY_MS = 600_000

const services = new WeakMap<HostSdk, SurveyService>()

/** p2p.back for the connected host; the mock keeps statuses in memory. */
export function surveyServiceFor(sdk: HostSdk, mode: ConnectMode | null): SurveyService {
  const cached = services.get(sdk)
  if (cached) return cached
  let service: SurveyService
  if (MOCK_ALLOWED && mode === 'mock') {
    const mock: MockSurvey = createMockSurvey()
    // e2e reads what was «sent».
    ;(window as { __barteronSurvey?: MockSurvey }).__barteronSurvey = mock
    service = mock
  } else {
    service = createSurveyService((url, init) => fetch(url, init))
  }
  services.set(sdk, service)
  return service
}

/** When the app started: the invitation counts from here, as the old timer did. */
const startedAt = Date.now()

function delay(mode: ConnectMode | null): number {
  if (!MOCK_ALLOWED || mode !== 'mock') return SURVEY_DELAY_MS
  // The demo and e2e shorten the wait (`window.__barteronMockSetup.surveyDelay`).
  const setup = (window as { __barteronMockSetup?: { surveyDelay?: number } }).__barteronMockSetup
  return typeof setup?.surveyDelay === 'number' ? setup.surveyDelay : SURVEY_DELAY_MS
}

/**
 * The survey for the signed-in user: whether it was answered, and sending.
 * Banned users never got the survey in the old app.
 */
export function useSurvey() {
  const session = useSessionStore()
  const client = useQueryClient()
  const me = computed(() => session.address)
  const key = computed(() => ['p2p', 'survey', me.value] as const)
  const service = computed(() => (session.sdk ? surveyServiceFor(session.sdk, session.mode) : null))

  // Asked only once the ban list is here: before it, everyone looks allowed.
  void loadBanList().catch(() => undefined)
  const status = useQuery({
    queryKey: key,
    enabled: computed(
      () => !!service.value && !!me.value && banListLoaded() && !isBanned(me.value)
    ),
    staleTime: Infinity,
    retry: false,
    queryFn: () => service.value!.status(me.value!),
  })

  const set = (value: SurveyStatus) => client.setQueryData(key.value, value)

  async function send(answers: SurveyAnswers): Promise<void> {
    if (!service.value || !me.value) throw new Error('not_signed_in')
    await hangIfBanned(me.value)
    await service.value.send(me.value, answers)
    set('completed')
  }

  /** «×» on the invitation: the old app sent `rejected` and never asked again. */
  function reject(): void {
    if (!service.value || !me.value) return
    set('rejected')
    void service.value.reject(me.value).catch(() => undefined)
  }

  return { me, status, send, reject }
}

/** The home page's invitation: a new survey, after the wait. */
export function useSurveyInvite() {
  const session = useSessionStore()
  const survey = useSurvey()
  const due = ref(false)
  const left = delay(session.mode) - (Date.now() - startedAt)
  if (left <= 0) due.value = true
  else {
    const timer = setTimeout(() => (due.value = true), left)
    onBeforeUnmount(() => clearTimeout(timer))
  }
  const shown = computed(() => due.value && survey.status.data.value === 'new')
  return { shown, reject: survey.reject }
}
