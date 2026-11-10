<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/ui/UiIcon.vue'
import ExchangeList from './ExchangeList.vue'
import FavoriteButton from './FavoriteButton.vue'
import OfferPhoto from './OfferPhoto.vue'
import PriceTag from './PriceTag.vue'
import type { OfferCardData } from './types'

/** Offer in the «Список» view: photo on the left, details and description on the right. */
const props = defineProps<{ offer: OfferCardData }>()
defineEmits<{ favorite: [] }>()
const { t } = useI18n()

const meta = computed(() => [props.offer.place, props.offer.time].filter(Boolean))
</script>

<template>
  <article class="row">
    <OfferPhoto class="row__photo" :src="offer.photo" />
    <div class="row__body">
      <div class="row__head">
        <RouterLink v-if="offer.to" :to="offer.to" class="row__title">{{ offer.title }}</RouterLink>
        <span v-else class="row__title">{{ offer.title }}</span>
        <FavoriteButton variant="plain" :active="offer.favorite" @toggle="$emit('favorite')" />
      </div>
      <PriceTag :price="offer.price" :size="20" />
      <ExchangeList variant="tags" :items="offer.exchange" :anything="offer.exchangeAnything" />
      <p v-if="offer.description" class="row__text">{{ offer.description }}</p>
      <div class="row__meta">
        <span v-for="(item, i) in meta" :key="i">{{ item }}</span>
        <span v-if="offer.delivery" class="row__delivery">
          <UiIcon name="delivery" :size="14" :stroke="2" />{{ t('offer.delivery') }}
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.row {
  position: relative;
  display: flex;
  gap: 20px;
  padding: 16px;
  border-radius: var(--radius-l);
  background: var(--surface);
  box-shadow: var(--shadow-1);
}

.row__photo {
  flex: none;
  width: 240px;
  align-self: flex-start;
}

.row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.row__title {
  font-size: 17px;
  line-height: 24px;
  font-weight: 500;
  color: var(--link);
  overflow-wrap: anywhere;
}

span.row__title {
  color: var(--text);
}

a.row__title::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-l);
}

a.row__title:focus-visible {
  outline: none;
}

a.row__title:focus-visible::after {
  box-shadow: 0 0 0 3px var(--ring);
}

.row__text {
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.row__meta {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.row__delivery {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 767px) {
  .row {
    gap: 12px;
    padding: 12px;
  }

  .row__photo {
    width: 112px;
  }

  .row__title {
    font-size: 15px;
    line-height: 20px;
  }

  .row__text {
    display: none;
  }
}
</style>
