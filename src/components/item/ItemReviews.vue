<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Offer } from '@/models/offer'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiBadge from '@/ui/UiBadge.vue'
import UiRating from '@/ui/UiRating.vue'
import ItemSection from './ItemSection.vue'
import ReviewForm from './ReviewForm.vue'

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
 * Scores 1–3 go through a moderator: `ReviewForm` handles the request.
 */
const props = defineProps<{
  average: { value: number; count: number }
  rows: ReviewRow[]
  /** Form: `score` — stars and text; `comment` — text only (the author answers); `none`. */
  form: 'score' | 'comment' | 'none'
  /** The offer: low scores need a moderator's permission for it. */
  offer?: Offer | null
  /** Under 100 reputation Bastyon does not allow low scores. */
  lowScoreBlocked?: boolean
  sending?: boolean
  own?: boolean
  /** Phone: two reviews and «Все N». */
  compact?: boolean
}>()
const emit = defineEmits<{ submit: [value: { stars: number | null; text: string }]; preview: [] }>()
const { t } = useI18n()

const showAll = ref(false)
const shown = computed(() =>
  props.compact && !showAll.value ? props.rows.slice(0, 2) : props.rows
)

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

    <ReviewForm
      v-if="form !== 'none'"
      :offer="offer"
      :form="form"
      :low-score-blocked="lowScoreBlocked"
      :sending="sending"
      @submit="emit('submit', $event)"
    />
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

@media (max-width: 767px) {
  .irv__row {
    gap: 10px;
  }

  .irv__avatar {
    display: none;
  }
}
</style>
