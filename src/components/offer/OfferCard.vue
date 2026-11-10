<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiBadge from '@/ui/UiBadge.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiRating from '@/ui/UiRating.vue'
import UiSpinner from '@/ui/UiSpinner.vue'
import ExchangeList from './ExchangeList.vue'
import FavoriteButton from './FavoriteButton.vue'
import OfferPhoto from './OfferPhoto.vue'
import PriceTag from './PriceTag.vue'
import type { OfferCardData } from './types'

/** Offer tile: photo 4:3 · title · price · «Меняю на» · place and time. */
const props = defineProps<{ offer: OfferCardData }>()
defineEmits<{ favorite: [] }>()

const { t } = useI18n()

const state = computed(() => props.offer.state ?? 'active')
const linked = computed(() => !!props.offer.to && state.value !== 'pending')
const meta = computed(() =>
  state.value === 'inactive'
    ? [props.offer.stateNote]
    : [props.offer.place, props.offer.time].filter(Boolean)
)
</script>

<template>
  <article class="card" :class="`card--${state}`">
    <OfferPhoto
      :src="offer.photo"
      :count="state === 'active' ? offer.photoCount : 0"
      :inactive="state === 'inactive'"
      :highlight="offer.match && state === 'active'"
    >
      <template
        v-if="state === 'inactive' || offer.match || offer.rating || offer.condition"
        #top-left
      >
        <UiBadge v-if="state === 'inactive'" tone="surface">
          {{ offer.stateLabel ?? t('offer.inactive') }}
        </UiBadge>
        <UiBadge v-else-if="offer.match" tone="match" icon="exchange" pill>
          <span class="card__match">{{ t('offer.match') }}</span>
        </UiBadge>
        <template v-else>
          <UiRating v-if="offer.rating" :value="offer.rating" variant="photo" />
          <UiBadge v-if="offer.condition" tone="photo">{{
            t(`offer.condition.${offer.condition}`)
          }}</UiBadge>
        </template>
      </template>
      <template v-if="state === 'active'" #top-right>
        <FavoriteButton :active="offer.favorite" @toggle="$emit('favorite')" />
      </template>
      <template v-if="offer.videoDuration && state === 'active'" #bottom-left>
        <UiBadge tone="photo" icon="play">
          <span class="visually-hidden">{{ t('offer.video') }}</span
          >{{ offer.videoDuration }}
        </UiBadge>
      </template>
      <div v-if="state === 'pending'" class="card__overlay">
        <UiSpinner :size="28" :stroke="2.2" />
        <span>{{ t('offer.publishing') }}</span>
      </div>
    </OfferPhoto>

    <div class="card__body">
      <RouterLink v-if="linked" :to="offer.to!" class="card__title">{{ offer.title }}</RouterLink>
      <span v-else class="card__title card__title--plain">{{ offer.title }}</span>
      <PriceTag :price="offer.price" :size="18" :muted="state === 'inactive'" />
      <ExchangeList
        v-if="state === 'active'"
        :items="offer.exchange"
        :anything="offer.exchangeAnything"
      />
      <UiBadge v-if="state === 'pending' && offer.stateNote" class="card__note" tone="warning" dot>
        {{ offer.stateNote }}
      </UiBadge>
      <span v-if="offer.safeDeal && state === 'active'" class="card__meta">
        <UiIcon class="card__safe" name="shield" :size="13" :stroke="2" />
        {{ [t('offer.safeDeal'), ...meta].join(' · ') }}
      </span>
      <span v-else-if="meta.length" class="card__meta">{{ meta.join(' · ') }}</span>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card--inactive {
  opacity: 0.72;
}

.card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.card__title {
  font-size: 15px;
  line-height: 20px;
  color: var(--link);
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* The whole card opens the offer; buttons and links inside stay on top. */
a.card__title::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-m);
}

a.card__title:focus-visible {
  outline: none;
}

a.card__title:focus-visible::after {
  box-shadow: 0 0 0 3px var(--ring);
}

.card__title--plain {
  color: var(--text);
}

.card--inactive .card__title--plain {
  color: var(--text2);
}

.card .card__note {
  align-self: flex-start;
  white-space: normal;
}

/* Two cards in a row on phones: the match label shrinks to its icon. */
@media (max-width: 767px) {
  .card__match {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
}

.card__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

.card__safe {
  color: var(--success);
}

.card__overlay {
  position: absolute;
  inset: 0;
  background: var(--overlay);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}
</style>
