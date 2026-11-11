import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBarteron } from '@/api/queries'
import { moderatorAddresses } from '@/config/roles'
import {
  findDecision,
  findRequest,
  moderationPath,
  pickModerator,
  withRequest,
  type ModerationRequest,
  type ModeratorDecision,
} from '@/models/moderation'
import type { Offer } from '@/models/offer'
import { useSessionStore } from '@/stores/session'
import { useChat } from './chat'
import { useMyAccount } from './my-account'

/** Barteron profiles of every moderator: who is on duty, and their decisions. */
export function useModerators(enabled: MaybeRefOrGetter<boolean> = true) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: ['barteron', 'moderators'],
    enabled: computed(() => !!barteron.value && toValue(enabled)),
    queryFn: () => barteron.value!.api.accounts(moderatorAddresses()),
    staleTime: 60_000,
  })
}

/**
 * Where my low score for this offer stands (s7-moderationstates, user side):
 * - `none` — no request yet;
 * - `waiting` — my request is with a moderator;
 * - `allowed` — a moderator let me give this score or higher, for a week;
 * - `rejected` — a moderator said no.
 */
export type ScoreModerationState =
  | { kind: 'none' }
  | { kind: 'waiting'; request: ModerationRequest }
  | { kind: 'allowed' | 'rejected'; decision: ModeratorDecision }

/** Why a request did not go: account on its way, nobody on duty, node or chat failure. */
export type RequestOutcome = 'sent' | 'updating' | 'nobody' | 'failed'

export function useScoreModeration(
  offer: MaybeRefOrGetter<Offer | null>,
  enabled: MaybeRefOrGetter<boolean> = true
) {
  const session = useSessionStore()
  const { t } = useI18n()
  const chat = useChat()
  const account = useMyAccount()
  const me = computed(() => session.address)
  const id = computed(() => toValue(offer)?.hash ?? null)
  const moderators = useModerators(() => toValue(enabled) && !!me.value && !!id.value)

  const state = computed<ScoreModerationState>(() => {
    const offerId = id.value
    if (!offerId || !me.value) return { kind: 'none' }
    const decision = findDecision(moderators.data.value ?? [], offerId, me.value)
    if (decision) return { kind: decision.status, decision }
    const request = findRequest(account.shown.value, offerId)
    return request ? { kind: 'waiting', request } : { kind: 'none' }
  })

  /** A score the moderator's decision lets me give; `null` — not decided. */
  const allowedScore = computed(() =>
    state.value.kind === 'allowed' ? state.value.decision.score : null
  )

  /**
   * Sends a request (old `submitModerationRequest`): a moderator on duty at
   * random, a chat with the reason and the link, then the request goes into
   * my profile — only if the chat opened.
   */
  async function request(score: number, reason: string): Promise<RequestOutcome> {
    const sdk = session.sdk
    const offerId = id.value
    const user = me.value
    if (!sdk || !offerId || !user) return 'failed'
    if (account.pending.value) return 'updating'
    if (!account.canSave.value) return 'failed'
    const fetched = await moderators.refetch()
    if (fetched.isError || !fetched.data) return 'failed'
    const moderator = pickModerator(fetched.data, user)
    if (!moderator) return 'nobody'
    const ok = await chat.open({
      members: [moderator],
      messages: [
        t('chatMessage.moderationTitle'),
        t('chatMessage.moderationReason', { reason }),
        sdk.get.applink(moderationPath({ offer: offerId, user, score, reason })),
      ],
    })
    if (!ok) return 'failed'
    account.save((a) => withRequest(a, { offerId, score, moderator }))
    return 'sent'
  }

  function openChat(moderator: string | null | undefined) {
    if (moderator) void chat.open({ members: [moderator], messages: [] })
  }

  return {
    state,
    allowedScore,
    checking: computed(() => moderators.isPending.value && moderators.fetchStatus.value !== 'idle'),
    checkFailed: computed(() => moderators.isError.value),
    request,
    openChat,
    chatOpening: chat.opening,
  }
}
