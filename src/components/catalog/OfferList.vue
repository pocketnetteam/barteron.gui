<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardContext } from '@/components/offer/card-context'
import OfferTile from '@/components/offer/OfferTile.vue'
import type { LatLng } from '@/lib/geohash'
import type { Offer } from '@/models/offer'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'

/**
 * Offers as tiles or rows with the list states of s2-catalog-states: first
 * load, node error with details, an error on the next portion that keeps
 * what is loaded, and «Показать ещё».
 */
const props = withDefaults(
  defineProps<{
    offers: readonly Offer[]
    view?: 'tile' | 'row'
    /** Tiles per row on a wide screen. */
    columns?: 4 | 5
    loading?: boolean
    error?: unknown
    moreError?: unknown
    hasMore?: boolean
    loadingMore?: boolean
    from?: LatLng | null
    skeletons?: number
    /** «Объявления подгружаются с ноды порциями». */
    portionsNote?: boolean
  }>(),
  { view: 'tile', columns: 4, skeletons: 8, from: null, portionsNote: false }
)
defineEmits<{ more: []; retry: [] }>()

const { t } = useI18n()
const context = useCardContext()

const details = computed(() => {
  const e = props.error as { message?: string } | null | undefined
  return e?.message ? t('list.errorDetails', { message: e.message }) : null
})
</script>

<template>
  <div class="olist">
    <div
      v-if="loading && !offers.length"
      class="olist__grid"
      :class="[`olist__grid--${view}`, `olist__grid--c${columns}`]"
      aria-busy="true"
      :aria-label="t('list.loading')"
      data-testid="list-loading"
    >
      <div v-for="i in skeletons" :key="i" class="olist__skeleton">
        <UiSkeleton :ratio="view === 'row' ? '1 / 1' : '4 / 3'" radius="12px" />
        <div class="olist__skeleton-lines">
          <UiSkeleton width="80%" height="14px" />
          <UiSkeleton width="45%" height="18px" />
          <UiSkeleton width="60%" height="12px" />
        </div>
      </div>
    </div>

    <div
      v-else-if="error && !offers.length"
      class="olist__error"
      role="alert"
      data-testid="list-error"
    >
      <span class="olist__error-icon"><UiIcon name="node" :size="30" :stroke="1.6" /></span>
      <h2 class="olist__error-title">{{ t('list.errorTitle') }}</h2>
      <p class="olist__error-text">{{ t('list.errorText') }}</p>
      <UiButton variant="contrast" icon="retry" @click="$emit('retry')">{{
        t('list.retry')
      }}</UiButton>
      <details v-if="details" class="olist__details">
        <summary>{{ t('list.details') }}</summary>
        <code>{{ details }}</code>
      </details>
    </div>

    <template v-else-if="offers.length">
      <div
        class="olist__grid"
        :class="[`olist__grid--${view}`, `olist__grid--c${columns}`]"
        data-testid="offer-list"
      >
        <OfferTile
          v-for="offer in offers"
          :key="offer.hash ?? offer.txHash ?? undefined"
          :offer="offer"
          :context="context"
          :view="view"
          :from="from"
        />
      </div>

      <div v-if="moreError" class="olist__more-error" role="alert">
        <UiIcon name="error" :size="20" />
        <span>{{ t('list.moreError') }}</span>
        <UiButton variant="on-danger" :size="36" @click="$emit('more')">{{
          t('list.retry')
        }}</UiButton>
      </div>
      <p v-if="moreError" class="olist__note">{{ t('list.moreErrorNote') }}</p>

      <div v-else-if="hasMore" class="olist__more">
        <UiButton
          variant="neutral"
          :size="48"
          :loading="loadingMore"
          data-testid="show-more"
          @click="$emit('more')"
        >
          {{ t('list.more') }}
        </UiButton>
        <p v-if="portionsNote" class="olist__note">{{ t('list.portions') }}</p>
      </div>
    </template>

    <slot v-else name="empty" />
  </div>
</template>

<style scoped>
.olist {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.olist__grid--tile {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px 16px;
}

.olist__grid--tile.olist__grid--c5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.olist__grid--row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 1279px) {
  .olist__grid--tile.olist__grid--c5 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1099px) {
  .olist__grid--tile,
  .olist__grid--tile.olist__grid--c5 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .olist__grid--tile,
  .olist__grid--tile.olist__grid--c5 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 10px;
  }
}

.olist__skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.olist__grid--row .olist__skeleton {
  flex-direction: row;
  padding: 12px;
  border-radius: var(--radius-l);
  background: var(--surface);
}

.olist__grid--row .olist__skeleton > :first-child {
  flex: none;
  width: 140px;
}

.olist__skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.olist__error {
  min-height: 340px;
  padding: 40px 32px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.olist__error-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--danger-soft);
  color: var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
}

.olist__error-title {
  margin: 0;
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
}

.olist__error-text {
  max-width: 420px;
  margin: 0 0 6px;
  font-size: 15px;
  line-height: 22px;
  color: var(--text2);
}

.olist__details {
  font-size: 13px;
  color: var(--text3);
}

.olist__details summary {
  cursor: pointer;
}

.olist__details code {
  display: block;
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.olist__more-error {
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--danger-soft);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.olist__more-error .ui-icon {
  flex: none;
  color: var(--danger);
}

.olist__more-error span {
  flex: 1;
}

.olist__more {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.olist__more :deep(.ui-button) {
  min-width: 166px;
}

.olist__note {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
  text-align: center;
}

@media (max-width: 767px) {
  .olist__more :deep(.ui-button) {
    width: 100%;
  }
}
</style>
