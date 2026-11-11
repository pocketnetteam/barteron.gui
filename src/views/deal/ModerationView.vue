<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAccount, useOffer } from '@/api/queries'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import { useChat } from '@/composables/chat'
import { usePeople } from '@/composables/exchanges'
import { useMyAccount } from '@/composables/my-account'
import { useModerators } from '@/composables/score-moderation'
import { isModerator } from '@/config/roles'
import { formatDate, formatMonthYear } from '@/lib/format'
import { txErrorText } from '@/lib/tx-errors'
import { findDecision, parseModerationQuery, withDecision } from '@/models/moderation'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiBadge from '@/ui/UiBadge.vue'
import UiBreadcrumbs from '@/ui/UiBreadcrumbs.vue'
import UiButton from '@/ui/UiButton.vue'
import UiChoiceCard from '@/ui/UiChoiceCard.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiRating from '@/ui/UiRating.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiTextarea from '@/ui/UiTextarea.vue'

/**
 * `/barter/moderation?offer=…&user=…&score=…[&reason=…]` (old route
 * «VotingModeration»; s7-moderation-desktop / -mobile,
 * s7-moderationstates): the moderator lets the user give a low score for a
 * week, or not. The decision goes into the moderator's Barteron profile;
 * the user hears of it in the chat.
 */
const route = useRoute()
const { t, locale } = useI18n()
const session = useSessionStore()
const context = useCardContext()
const chat = useChat()
const account = useMyAccount()
const id = useId()

const request = computed(() => parseModerationQuery(route.query))
const me = computed(() => session.address)
const moderator = computed(() => isModerator(me.value))

const offerQuery = useOffer(() => request.value?.offer)
const offer = computed(() => offerQuery.data.value ?? null)
const card = computed(() => (offer.value ? offerCardData(offer.value, context.value) : null))
const userAccount = useAccount(() => request.value?.user)
const authorAccount = useAccount(() => offer.value?.address)
const people = usePeople(() =>
  [request.value?.user ?? '', offer.value?.address ?? ''].filter(Boolean)
)
const moderators = useModerators(() => moderator.value && !!request.value)
const decision = computed(() =>
  request.value
    ? findDecision(moderators.data.value ?? [], request.value.offer, request.value.user)
    : null
)

const page = computed(() => {
  if (!request.value) return 'bad'
  if (session.status !== 'ready' || session.account === 'unknown') return 'loading'
  if (session.account !== 'signed-in') return 'signin'
  if (!moderator.value) return 'notModerator'
  if (offerQuery.isPending.value) return 'loading'
  return 'ready'
})

const ratingFmt = (value: number) =>
  new Intl.NumberFormat(locale.value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
const userName = computed(
  () => people.value.get(request.value?.user ?? '')?.name || request.value?.user.slice(0, 8) || ''
)
const authorName = computed(
  () => people.value.get(offer.value?.address ?? '')?.name || offer.value?.address.slice(0, 8) || ''
)
const userMeta = computed(() => {
  const a = userAccount.data.value
  const parts: string[] = []
  if (a?.regdate)
    parts.push(t('moderation.page.since', { date: formatMonthYear(a.regdate, locale.value) }))
  if (a?.ratingCount) parts.push(t('moderation.page.rating', { value: ratingFmt(a.rating) }))
  return parts.join(' · ')
})
const authorMeta = computed(() => {
  const a = authorAccount.data.value
  return a?.ratingCount
    ? t('moderation.page.authorRating', { value: ratingFmt(a.rating) })
    : t('moderation.page.author')
})

const badge = computed<{ tone: 'success' | 'danger' | 'warning'; key: string }>(() =>
  decision.value
    ? {
        tone: decision.value.status === 'allowed' ? 'success' : 'danger',
        key: decision.value.status,
      }
    : { tone: 'warning', key: 'pending' }
)

// ─── Decision ───────────────────────────────────────────────────────────────
const verdict = ref<'allowed' | 'rejected' | undefined>(undefined)
const rejection = ref('')
const problem = ref<string | null>(null)
const executing = ref(false)
const done = ref<'allowed' | 'rejected' | null>(null)

/** Old `execute`: the decision into my profile, then the message to the user. */
async function execute() {
  const r = request.value
  const sdk = session.sdk
  if (!r || !verdict.value || !sdk || executing.value) return
  problem.value = null
  if (account.pending.value) {
    problem.value = t('moderation.page.updating')
    return
  }
  if (account.activating.value || !account.canSave.value) {
    problem.value = t('moderation.page.activating')
    return
  }
  const status = verdict.value
  executing.value = true
  try {
    const sent = account.save((a) =>
      withDecision(a, { offerId: r.offer, userAddress: r.user, score: r.score, status })
    )
    const tx = sent ? await sent : null
    if (!tx || tx.status === 'failed') {
      problem.value = `${t('moderation.page.saveFailed')}: ${txErrorText(tx?.error, t)}`
      return
    }
    const messages = [sdk.get.applink(`barter/${r.offer}`)]
    if (status === 'allowed') {
      messages.push(t('chatMessage.moderationAllowed', { score: r.score }))
    } else {
      messages.push(t('chatMessage.moderationRejected'))
      const reason = rejection.value.trim()
      if (reason) messages.push(t('chatMessage.moderationRejectReason', { reason }))
    }
    done.value = status
    void chat.open({ name: offer.value?.caption, members: [r.user], messages })
  } finally {
    executing.value = false
  }
}

function chatWith(address: string | undefined) {
  if (address) void chat.open({ name: offer.value?.caption, members: [address], messages: [] })
}

const crumbs = computed(() => [
  { label: t('moderation.page.home'), to: { name: 'home' } },
  { label: t('moderation.page.crumb') },
])
</script>

<template>
  <AppLayout>
    <template #mobile-top>
      <PageTopBar :title="t('moderation.page.crumb')" :back="{ name: 'home' }" />
    </template>

    <div class="mv container" data-testid="moderation-page" :data-state="page">
      <UiEmptyState
        v-if="page === 'bad'"
        class="mv__panel"
        icon="warning"
        :title="t('moderation.page.bad')"
        :text="t('moderation.page.badText')"
      />
      <UiEmptyState
        v-else-if="page === 'signin'"
        class="mv__panel"
        icon="lock"
        :title="t('moderation.page.signIn')"
      >
        <UiButton @click="session.ensureSignedIn()">{{ t('deal.signIn.action') }}</UiButton>
      </UiEmptyState>
      <UiEmptyState
        v-else-if="page === 'notModerator'"
        class="mv__panel"
        icon="lock"
        :title="t('moderation.page.notModerator')"
        :text="t('moderation.page.notModeratorText')"
        data-testid="moderation-not-moderator"
      >
        <UiButton variant="ghost" :to="{ name: 'home' }">{{
          t('moderation.page.toHome')
        }}</UiButton>
      </UiEmptyState>
      <template v-else-if="page === 'loading'">
        <UiSkeleton width="50%" :ratio="'14 / 1'" radius="8px" />
        <UiSkeleton width="100%" :ratio="'5 / 1'" radius="20px" />
      </template>

      <template v-else-if="request">
        <UiBreadcrumbs class="mv__crumbs" :items="crumbs" />
        <header class="mv__head">
          <h1 class="mv__title">{{ t('moderation.page.title') }}</h1>
          <UiBadge :tone="badge.tone" data-testid="moderation-badge">{{
            t(`moderation.page.badge.${badge.key}`)
          }}</UiBadge>
        </header>

        <div class="mv__grid">
          <div class="mv__main">
            <!-- The offer first on the phone (s7-moderation-mobile). -->
            <RouterLink
              v-if="offer && card"
              :to="{ name: 'barterItem', params: { id: request.offer } }"
              class="mv__card mv__moffer"
            >
              <span class="mv__muted">{{ t('moderation.page.offer') }}</span>
              <strong>{{ offer.caption }}</strong>
              <span class="mv__muted">{{ authorName }} · {{ authorMeta }}</span>
            </RouterLink>

            <section v-if="done" class="mv__card mv__done" data-testid="moderation-done">
              <span class="mv__done-icon" aria-hidden="true">✓</span>
              <h2>{{ t('moderation.page.doneTitle') }}</h2>
              <p class="mv__muted">
                {{
                  done === 'allowed'
                    ? t('moderation.page.doneAllowed')
                    : t('moderation.page.doneRejected')
                }}
              </p>
            </section>

            <section class="mv__card mv__user">
              <div class="mv__user-head">
                <UiAvatar
                  :size="56"
                  :name="userName"
                  :seed="request.user"
                  :src="people.get(request.user)?.avatar"
                />
                <span class="mv__user-who">
                  <span class="mv__muted">{{ t('moderation.page.user') }}</span>
                  <strong class="mv__user-name">{{ userName }}</strong>
                  <span v-if="userMeta" class="mv__muted">{{ userMeta }}</span>
                </span>
                <UiButton
                  class="mv__user-chat"
                  variant="outline"
                  external
                  data-testid="moderation-chat-user"
                  @click="chatWith(request.user)"
                  >{{ t('moderation.page.chatUser') }}</UiButton
                >
              </div>
              <div class="mv__ask">
                <div class="mv__ask-score">
                  <span class="mv__muted">{{ t('moderation.page.desired') }}</span>
                  <span class="mv__stars">
                    <UiRating :value="request.score" variant="stars" hide-value />
                    <strong>{{ t('moderation.page.of5', { n: request.score }) }}</strong>
                  </span>
                </div>
                <div class="mv__ask-reason">
                  <span class="mv__muted">{{ t('moderation.page.reason') }}</span>
                  <span v-if="request.reason" data-testid="moderation-reason-text"
                    >«{{ request.reason }}»</span
                  >
                  <span v-else class="mv__muted">{{ t('moderation.page.noReason') }}</span>
                </div>
              </div>
              <div class="mv__mchats">
                <UiButton variant="outline" external block @click="chatWith(request.user)">{{
                  t('moderation.page.chatUser')
                }}</UiButton>
                <UiButton variant="outline" external block @click="chatWith(offer?.address)">{{
                  t('moderation.page.toAuthor')
                }}</UiButton>
              </div>
            </section>

            <section class="mv__before">
              <h2>{{ t('moderation.page.before') }}</h2>
              <ol>
                <li><span>1</span>{{ t('moderation.page.before1') }}</li>
                <li><span>2</span>{{ t('moderation.page.before2') }}</li>
              </ol>
            </section>

            <section v-if="!done" class="mv__card mv__decide">
              <h2>{{ t('moderation.page.decide') }}</h2>
              <UiAlert
                v-if="decision"
                :tone="decision.status === 'allowed' ? 'success' : 'warning'"
              >
                {{
                  decision.status === 'allowed'
                    ? t('moderation.page.decidedAllowed', {
                        score: decision.score,
                        date: formatDate(decision.createdAt, locale),
                      })
                    : t('moderation.page.decidedRejected', {
                        date: formatDate(decision.createdAt, locale),
                      })
                }}
              </UiAlert>
              <div class="mv__choices" role="radiogroup" :aria-label="t('moderation.page.decide')">
                <UiChoiceCard
                  v-model="verdict"
                  value="allowed"
                  name="verdict"
                  :title="t('moderation.page.allow')"
                  :description="t('moderation.page.allowText', { score: request.score })"
                  data-testid="moderation-allow"
                />
                <UiChoiceCard
                  v-model="verdict"
                  value="rejected"
                  name="verdict"
                  :title="t('moderation.page.reject')"
                  :description="t('moderation.page.rejectText')"
                  data-testid="moderation-reject"
                />
              </div>
              <div v-if="verdict === 'rejected'" class="mv__reason">
                <label :for="`mv-${id}`">{{ t('moderation.page.reasonLabel') }}</label>
                <UiTextarea
                  :id="`mv-${id}`"
                  v-model="rejection"
                  :rows="3"
                  :maxlength="1000"
                  :placeholder="t('moderation.page.reasonPlaceholder')"
                  data-testid="moderation-rejection"
                />
                <p class="mv__muted">{{ t('moderation.page.reasonHint') }}</p>
              </div>
              <UiAlert v-if="problem" tone="danger" live data-testid="moderation-problem">{{
                problem
              }}</UiAlert>
              <div class="mv__go">
                <UiButton
                  :size="52"
                  :disabled="!verdict"
                  :loading="executing"
                  data-testid="moderation-execute"
                  @click="execute"
                  >{{ t('moderation.page.execute') }}</UiButton
                >
                <p class="mv__muted">{{ t('moderation.page.executeNote') }}</p>
              </div>
            </section>
          </div>

          <aside class="mv__aside">
            <section v-if="offer && card" class="mv__card mv__offer">
              <span class="mv__muted">{{ t('moderation.page.offer') }}</span>
              <RouterLink
                :to="{ name: 'barterItem', params: { id: request.offer } }"
                class="mv__offer-link"
              >
                <OfferPhoto :src="card.photo" ratio="4 / 3" radius="12px" />
                <span class="mv__offer-title">{{ offer.caption }}</span>
              </RouterLink>
              <PriceTag :price="card.price" :size="18" no-equivalent />
              <div class="mv__author">
                <UiAvatar
                  :size="32"
                  :name="authorName"
                  :seed="offer.address"
                  :src="people.get(offer.address)?.avatar"
                />
                <span class="mv__user-who">
                  <strong>{{ authorName }}</strong>
                  <span class="mv__muted">{{ authorMeta }}</span>
                </span>
              </div>
              <UiButton variant="outline" block external @click="chatWith(offer.address)">{{
                t('moderation.page.writeAuthor')
              }}</UiButton>
            </section>
            <section class="mv__card mv__why">
              <h2>{{ t('moderation.page.whyTitle') }}</h2>
              <p class="mv__muted">{{ t('moderation.page.whyText') }}</p>
            </section>
          </aside>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<style scoped>
.mv {
  padding-top: 20px;
  padding-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mv__panel {
  max-width: 560px;
  margin: 40px auto;
}

.mv__card {
  padding: 20px;
  border-radius: var(--radius-xl);
  background: var(--surface);
}

.mv__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.mv__title {
  font-size: 30px;
  line-height: 38px;
  font-weight: 700;
}

.mv__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  align-items: start;
  gap: 24px;
}

.mv__main,
.mv__aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mv__muted {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.mv__user {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mv__user-head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mv__user-who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mv__user-name {
  font-size: 18px;
  line-height: 24px;
}

.mv__ask {
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 24px;
}

.mv__ask-score,
.mv__ask-reason {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mv__ask-reason {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.mv__stars {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.mv__mchats,
.mv__moffer {
  display: none;
}

.mv__before {
  padding: 16px 18px;
  border-radius: var(--radius-l);
  background: var(--info-soft);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
}

.mv__before h2 {
  color: var(--info);
  font-size: 14px;
  font-weight: 700;
}

.mv__before ol {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mv__before li {
  display: flex;
  gap: 10px;
}

.mv__before li span {
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: 50%;
  background: var(--surface);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
}

.mv__decide {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mv__decide h2,
.mv__why h2 {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.mv__choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mv__reason {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mv__reason label {
  font-size: 13px;
  font-weight: 600;
}

.mv__go {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mv__offer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mv__offer-link {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--link);
  text-decoration: none;
}

.mv__offer-title {
  font-weight: 600;
  font-size: 16px;
  line-height: 22px;
}

.mv__author {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.mv__why {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mv__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.mv__done h2 {
  font-size: 20px;
  line-height: 26px;
}

.mv__done-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--success-soft);
  color: var(--success);
  display: grid;
  place-items: center;
  font-size: 26px;
}

@media (max-width: 1023px) {
  .mv__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 767px) {
  .mv {
    padding-top: 12px;
    padding-bottom: 24px;
    gap: 12px;
  }

  .mv__crumbs,
  .mv__title,
  .mv__aside,
  .mv__user-chat {
    display: none;
  }

  .mv__card {
    padding: 16px;
    border-radius: var(--radius-l);
  }

  .mv__moffer {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: inherit;
    text-decoration: none;
  }

  .mv__ask {
    flex-direction: column;
    gap: 12px;
  }

  .mv__mchats {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 8px;
  }

  .mv__mchats :deep(.ui-button) {
    min-width: 0;
    padding-inline: 10px;
  }

  .mv__choices {
    grid-template-columns: 1fr;
  }

  .mv__go {
    flex-direction: column;
    align-items: stretch;
  }

  .mv__go p {
    text-align: center;
  }
}
</style>
