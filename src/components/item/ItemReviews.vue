<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiBadge from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiRating from '@/ui/UiRating.vue'
import UiTextarea from '@/ui/UiTextarea.vue'
import ItemSection from './ItemSection.vue'

export interface ReviewRow {
  id: string
  name: string
  seed: string
  avatar?: string | null
  /** 1–5, from the review's `info`; `null` — a review without a score. */
  stars: number | null
  date: string
  text: string
  /** My review on its way, or refused. */
  pending?: 'publishing' | 'failed'
  error?: string | null
}

/**
 * «Отзывы об объявлении» (s3-item; s3-item-states «Отзыв · …»). Anyone signed
 * in may write; a score is given once and never by the author (old `votes`).
 * Scores 1–3 go through a moderator (stage 8): here the form explains it.
 */
const props = defineProps<{
  average: { value: number; count: number }
  rows: ReviewRow[]
  /** Form: `score` — stars and text; `comment` — text only (the author answers); `none`. */
  form: 'score' | 'comment' | 'none'
  /** Under 100 reputation Bastyon does not allow low scores. */
  lowScoreBlocked?: boolean
  sending?: boolean
  own?: boolean
  /** Phone: two reviews and «Все N». */
  compact?: boolean
}>()
const emit = defineEmits<{ submit: [value: { stars: number | null; text: string }]; preview: [] }>()
const { t } = useI18n()
const id = useId()

const stars = ref(0)
const text = ref('')
const showAll = ref(false)
const shown = computed(() =>
  props.compact && !showAll.value ? props.rows.slice(0, 2) : props.rows
)
/** 1–3: needs a moderator; not possible yet (stage 8). */
const low = computed(() => props.form === 'score' && stars.value > 0 && stars.value <= 3)
const canSend = computed(() => {
  if (low.value || props.sending) return false
  if (props.form === 'score') return stars.value > 0 || !!text.value.trim()
  return !!text.value.trim()
})

function submit() {
  if (!canSend.value) return
  emit('submit', {
    stars: props.form === 'score' && stars.value ? stars.value : null,
    text: text.value.trim(),
  })
  stars.value = 0
  text.value = ''
}

const fmt = (value: number) => value.toFixed(1).replace('.', ',')
</script>

<template>
  <ItemSection
    :title="compact ? undefined : t('item.reviews.title')"
    :subtitle="
      compact
        ? undefined
        : own && !rows.length
          ? t('item.reviews.none')
          : t('item.reviews.subtitle')
    "
    heading-id="item-reviews"
  >
    <template #end>
      <button v-if="own && !rows.length" type="button" class="irv__link" @click="emit('preview')">
        {{ t('item.reviews.asBuyer') }}
      </button>
      <div v-else-if="average.count && !compact" class="irv__avg">
        <span class="irv__avg-value">{{ fmt(average.value) }}</span>
        <span class="irv__avg-meta">
          <UiRating :value="average.value" variant="stars" hide-value />
          <span>{{ t('item.reviews.scores', { n: average.count }, average.count) }}</span>
        </span>
      </div>
    </template>

    <div v-if="compact" class="irv__compact-head">
      <h2 class="irv__compact-title">
        {{ t('item.reviews.titleShort')
        }}<template v-if="average.count"> · {{ fmt(average.value) }}</template>
      </h2>
      <button
        v-if="rows.length > 2 && !showAll"
        type="button"
        class="irv__link"
        @click="showAll = true"
      >
        {{ t('item.reviews.all', { n: rows.length }) }}
      </button>
    </div>

    <p v-if="!rows.length && !own" class="irv__empty">{{ t('item.reviews.empty') }}</p>

    <ul v-if="rows.length" class="irv__list">
      <li v-for="row in shown" :key="row.id" class="irv__row">
        <UiAvatar
          class="irv__avatar"
          :name="row.name"
          :seed="row.seed"
          :src="row.avatar"
          :size="40"
        />
        <div class="irv__body">
          <div class="irv__meta">
            <strong>{{ row.name }}</strong>
            <UiRating v-if="row.stars" :value="row.stars" variant="stars" hide-value />
            <span v-if="!row.pending" class="irv__date">{{ row.date }}</span>
            <UiBadge v-else-if="row.pending === 'publishing'" tone="warning">{{
              t('item.reviews.publishing')
            }}</UiBadge>
            <UiBadge v-else tone="danger">{{ t('item.reviews.failed') }}</UiBadge>
          </div>
          <p class="irv__text">{{ row.text }}</p>
          <p v-if="row.pending === 'failed' && row.error" class="irv__error">{{ row.error }}</p>
        </div>
      </li>
    </ul>

    <form v-if="form !== 'none'" class="irv__form" @submit.prevent="submit">
      <h3 class="irv__form-title">
        {{ form === 'score' ? t('item.reviews.formTitle') : t('item.reviews.answerTitle') }}
      </h3>
      <div
        v-if="form === 'score'"
        class="irv__stars"
        role="radiogroup"
        :aria-label="t('item.reviews.starsLabel')"
      >
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          role="radio"
          class="irv__star"
          :aria-checked="stars === n"
          :aria-label="t('item.reviews.star', { n }, n)"
          @click="stars = stars === n ? 0 : n"
        >
          <UiIcon :name="n <= stars ? 'star-filled' : 'star'" :size="28" :stroke="1.6" />
        </button>
      </div>
      <div v-if="low" class="irv__low" role="alert">
        <UiIcon name="warning" :size="18" />
        <p>{{ lowScoreBlocked ? t('item.reviews.lowBlocked') : t('item.reviews.lowSoon') }}</p>
      </div>
      <UiTextarea
        :id="`irv-${id}`"
        v-model="text"
        :rows="3"
        :aria-label="t('item.reviews.placeholder')"
        :placeholder="t('item.reviews.placeholder')"
        :maxlength="1000"
      />
      <div class="irv__actions">
        <UiButton
          type="submit"
          :size="44"
          :disabled="!canSend"
          :loading="sending"
          data-testid="review-send"
        >
          {{ t('item.reviews.send') }}
        </UiButton>
        <button v-if="low" type="button" class="irv__link" @click="stars = 0">
          {{ t('item.reviews.changeScore') }}
        </button>
      </div>
      <p class="irv__hint">{{ t('item.reviews.hint') }}</p>
    </form>
  </ItemSection>
</template>

<style scoped>
.irv__avg {
  display: flex;
  align-items: center;
  gap: 8px;
}

.irv__avg-value {
  font: 700 32px / 36px var(--font-sans);
  color: var(--text);
}

.irv__avg-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--text2);
}

.irv__compact-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.irv__compact-title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.irv__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.irv__empty {
  color: var(--text2);
}

.irv__list {
  display: flex;
  flex-direction: column;
}

.irv__row {
  padding: 16px 0;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 14px;
}

.irv__avatar {
  flex: none;
}

.irv__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.irv__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  font-size: 14px;
}

.irv__date {
  color: var(--text3);
  font-size: 13px;
}

.irv__text {
  font-size: 15px;
  line-height: 22px;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.irv__error {
  color: var(--danger);
  font-size: 13px;
}

.irv__form {
  padding: 16px;
  border-radius: var(--radius-l);
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.irv__form-title {
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
}

.irv__stars {
  display: flex;
  gap: 4px;
}

.irv__star {
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

.irv__star:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.irv__low {
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--warning-soft);
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 18px;
}

.irv__low .ui-icon {
  flex: none;
  color: var(--warning);
}

.irv__actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.irv__hint {
  color: var(--text3);
  font-size: 12px;
  line-height: 16px;
}

@media (max-width: 767px) {
  .irv__row {
    gap: 10px;
  }

  .irv__avatar {
    display: none;
  }
}
</style>
