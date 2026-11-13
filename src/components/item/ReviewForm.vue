<script setup lang="ts">
import { computed, defineAsyncComponent, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { useScoreModeration } from '@/composables/score-moderation'
import { formatDate } from '@/lib/format'
import { VOTING_MODERATION_TTL } from '@/models/account'
import { LOW_SCORE_LIMIT } from '@/models/moderation'
import type { Offer } from '@/models/offer'
import { REVIEW_MAX_LENGTH } from '@/models/review'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiTextarea from '@/ui/UiTextarea.vue'

const ModerationRequestDialog = defineAsyncComponent(() => import('./ModerationRequestDialog.vue'))
const ConfirmDialog = defineAsyncComponent(() => import('./ConfirmDialog.vue'))

/**
 * The review form (s3-item-states «Отзыв · …», s7-moderationstates user
 * side). A score is given once and never by the author. Scores 1–3 need a
 * moderator: under 100 reputation Bastyon refuses them anyway; otherwise
 * the user sends a request, waits, and gives the score the moderator
 * allowed — or 4–5, or a review without a score.
 */
const props = defineProps<{
  /** The offer: for the moderation of low scores. */
  offer?: Offer | null
  /** `score` — stars and text; `comment` — text only. */
  form: 'score' | 'comment'
  /** Under 100 reputation Bastyon does not allow low scores. */
  lowScoreBlocked?: boolean
  sending?: boolean
  title?: string
}>()
const emit = defineEmits<{ submit: [value: { stars: number | null; text: string }] }>()
const { t, locale } = useI18n()
const id = useId()
const session = useSessionStore()

const stars = ref(0)
const text = ref('')
const moderation = useScoreModeration(
  () => props.offer ?? null,
  () => props.form === 'score' && !props.lowScoreBlocked
)
const state = computed(() => moderation.state.value)

const low = computed(
  () => props.form === 'score' && stars.value > 0 && stars.value < LOW_SCORE_LIMIT
)
/** What a low score needs now. */
const lowCase = computed(() => {
  if (!low.value) return null
  if (props.lowScoreBlocked) return 'blocked'
  const s = state.value
  if (s.kind === 'allowed') return stars.value >= s.decision.score ? 'ok' : 'lower'
  if (s.kind === 'rejected') return 'rejected'
  if (s.kind === 'waiting') return 'waiting'
  if (moderation.checking.value) return 'checking'
  // A decision may be there: no new request until the node answers.
  if (moderation.checkFailed.value) return 'checkFailed'
  return 'needed'
})
const canSend = computed(() => {
  if (props.sending) return false
  if (low.value && lowCase.value !== 'ok') return false
  if (props.form === 'score') return stars.value > 0 || !!text.value.trim()
  return !!text.value.trim()
})

/** A score cannot be changed once it is in the network: ask first (s8-confirm). */
const confirmOpen = ref(false)

async function submit() {
  if (!canSend.value) return
  // Signed in first: the text stays if not, and the form may change (my
  // offer, scored already) before anything goes.
  if (!(await session.ensureSignedIn()) || !canSend.value) return
  if (props.form === 'score' && stars.value) confirmOpen.value = true
  else send()
}

/** Signed out: sign in, then the form checks the moderator's decision first. */
async function toModerator() {
  if (session.account !== 'signed-in') {
    await session.ensureSignedIn()
    return
  }
  requestOpen.value = true
}

function send() {
  confirmOpen.value = false
  emit('submit', {
    stars: props.form === 'score' && stars.value ? stars.value : null,
    text: text.value.trim(),
  })
  stars.value = 0
  text.value = ''
}

const banner = computed(() =>
  props.form === 'score' && !props.lowScoreBlocked ? state.value : null
)
const until = computed(() =>
  state.value.kind === 'allowed'
    ? formatDate(state.value.decision.createdAt + VOTING_MODERATION_TTL, locale.value)
    : ''
)

const requestOpen = ref(false)
const reason = ref('')
</script>

<template>
  <form class="rvf" data-testid="review-form" @submit.prevent="submit">
    <h3 class="rvf__title">
      {{
        title ?? (form === 'score' ? t('item.reviews.formTitle') : t('item.reviews.answerTitle'))
      }}
    </h3>

    <UiAlert
      v-if="banner?.kind === 'allowed'"
      tone="success"
      :title="t('moderation.review.allowedTitle', { score: banner.decision.score })"
      data-testid="moderation-allowed"
      >{{ t('moderation.review.allowedText', { date: until }) }}</UiAlert
    >
    <UiAlert
      v-else-if="banner?.kind === 'rejected'"
      tone="danger"
      :title="t('moderation.review.rejectedTitle')"
      data-testid="moderation-rejected"
    >
      {{ t('moderation.review.rejectedText') }} {{ t('moderation.review.rejectedMore') }}
      <template #action>
        <UiButton
          variant="ghost"
          :size="36"
          external
          @click="moderation.openChat(banner.decision.moderator)"
          >{{ t('moderation.review.chat') }}</UiButton
        >
      </template>
    </UiAlert>
    <div
      v-else-if="banner?.kind === 'waiting'"
      class="rvf__waiting"
      data-testid="moderation-waiting"
    >
      <UiIcon name="clock" :size="20" />
      <span>{{
        banner.request.score
          ? t('moderation.review.waiting', { score: banner.request.score })
          : t('moderation.review.waitingAny')
      }}</span>
    </div>
    <button
      v-if="banner?.kind === 'waiting' && banner.request.moderator"
      type="button"
      class="rvf__link"
      @click="moderation.openChat(banner.request.moderator)"
    >
      {{ t('moderation.review.openChat') }} ↗
    </button>

    <div
      v-if="form === 'score'"
      class="rvf__stars"
      role="radiogroup"
      :aria-label="t('item.reviews.starsLabel')"
    >
      <button
        v-for="n in 5"
        :key="n"
        type="button"
        role="radio"
        class="rvf__star"
        :aria-checked="stars === n"
        :aria-label="t('item.reviews.star', { n }, n)"
        @click="stars = stars === n ? 0 : n"
      >
        <UiIcon :name="n <= stars ? 'star-filled' : 'star'" :size="28" :stroke="1.6" />
      </button>
    </div>

    <div v-if="lowCase === 'blocked'" class="rvf__low" role="alert">
      <UiIcon name="warning" :size="18" />
      <p>{{ t('item.reviews.lowBlocked') }}</p>
    </div>
    <p v-else-if="lowCase === 'lower' && state.kind === 'allowed'" class="rvf__error" role="alert">
      {{ t('moderation.review.lower', { score: stars, allowed: state.decision.score }) }}
    </p>
    <p v-else-if="lowCase === 'checking'" class="rvf__hint">
      {{ t('moderation.review.checking') }}
    </p>
    <p v-else-if="lowCase === 'checkFailed'" class="rvf__error" role="alert">
      {{ t('moderation.review.checkFailed') }}
      <button
        type="button"
        class="rvf__link rvf__retry"
        data-testid="moderation-recheck"
        @click="moderation.recheck()"
      >
        {{ t('ui.retry') }}
      </button>
    </p>
    <div
      v-else-if="lowCase === 'needed'"
      class="rvf__low"
      role="alert"
      data-testid="moderation-needed"
    >
      <UiIcon name="warning" :size="18" />
      <p>{{ t('moderation.review.needed') }}</p>
    </div>

    <UiTextarea
      :id="`rvf-${id}`"
      v-model="text"
      :rows="3"
      :aria-label="t('item.reviews.placeholder')"
      :placeholder="t('item.reviews.placeholder')"
      :maxlength="REVIEW_MAX_LENGTH"
    />
    <div class="rvf__actions">
      <UiButton
        v-if="lowCase === 'needed'"
        :size="44"
        data-testid="moderation-open"
        @click="toModerator"
      >
        {{ t('moderation.review.toModerator') }}
      </UiButton>
      <UiButton
        v-else
        type="submit"
        :size="44"
        :disabled="!canSend"
        :loading="sending"
        data-testid="review-send"
      >
        {{ t('item.reviews.send') }}
      </UiButton>
      <button v-if="low" type="button" class="rvf__link" @click="stars = 0">
        {{ t('item.reviews.changeScore') }}
      </button>
    </div>
    <p class="rvf__hint">{{ t('item.reviews.hint') }}</p>

    <ModerationRequestDialog
      v-if="requestOpen"
      v-model:open="requestOpen"
      v-model:reason="reason"
      :score="stars"
      :send="(r) => moderation.request(stars, r)"
    />
    <ConfirmDialog
      v-if="confirmOpen"
      v-model:open="confirmOpen"
      :title="t('item.reviews.confirmTitle', { n: stars })"
      :text="t('item.reviews.confirmText')"
      :confirm="t('item.reviews.confirmSend')"
      @confirm="send"
    />
  </form>
</template>

<style scoped>
.rvf {
  padding: 16px;
  border-radius: var(--radius-l);
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rvf__title {
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
}

.rvf__stars {
  display: flex;
  gap: 4px;
}

.rvf__star {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-s);
  background: none;
  color: var(--star);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rvf__star:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.rvf__low,
.rvf__waiting {
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--warning-soft);
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 18px;
}

.rvf__waiting {
  background: var(--muted);
  font-size: 14px;
  line-height: 20px;
}

.rvf__low .ui-icon {
  flex: none;
  color: var(--warning);
}

.rvf__waiting .ui-icon {
  flex: none;
  color: var(--text2);
}

.rvf__error {
  color: var(--danger);
  font-size: 13px;
  line-height: 18px;
}

.rvf__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.rvf__link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.rvf__retry {
  margin-left: 6px;
  font-size: 13px;
  line-height: 18px;
}

.rvf__hint {
  color: var(--text3);
  font-size: 12px;
  line-height: 16px;
}
</style>
