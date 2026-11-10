<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import type { MatchItem } from '@/composables/may-match'
import UiIcon from '@/ui/UiIcon.vue'

/** A card of «Может подойти для обмена»: the way of exchange and which of my offers it fits. */
const props = defineProps<{ item: MatchItem }>()
const { t } = useI18n()
const context = useCardContext()

const data = computed(() => offerCardData(props.item.target, context.value))
const to = computed(() =>
  props.item.kind === 'direct'
    ? { name: 'barterItem', params: { id: props.item.target.hash ?? '' } }
    : {
        name: 'ThreeSidedSearch',
        query: { source: props.item.source.hash ?? '', target: props.item.target.hash ?? '' },
      }
)
</script>

<template>
  <article class="match" role="listitem">
    <OfferPhoto :src="data.photo" ratio="1 / 1" radius="10px">
      <template #top-left>
        <span class="match__badge">
          <UiIcon name="exchange" :size="11" :stroke="2.6" />
          <span class="match__badge-long">{{ t(`match.${item.kind}`) }}</span>
          <span class="match__badge-short">{{ t(`match.${item.kind}Short`) }}</span>
        </span>
      </template>
    </OfferPhoto>
    <PriceTag :price="data.price" :size="16" no-equivalent />
    <RouterLink class="match__title" :to="to">{{ data.title }}</RouterLink>
    <span class="match__for">{{ t('match.for', { title: item.source.caption }) }}</span>
  </article>
</template>

<style scoped>
.match {
  position: relative;
  flex: none;
  box-sizing: border-box;
  width: 196px;
  padding: 10px;
  border-radius: var(--radius-l);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match:hover {
  box-shadow: var(--shadow-1);
}

.match__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: #ffffff;
  font-size: 11px;
  line-height: 14px;
  font-weight: 600;
}

.match__badge-short {
  display: none;
}

.match__title {
  font-size: 13px;
  line-height: 17px;
  color: var(--link);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.match__title::after {
  content: '';
  position: absolute;
  inset: 0;
}

.match__title:focus-visible {
  outline: none;
}

.match:focus-within {
  box-shadow: 0 0 0 3px var(--ring);
}

.match__for {
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .match {
    width: 140px;
    padding: 0;
    background: none;
    gap: 6px;
  }

  .match:hover {
    box-shadow: none;
  }

  .match__badge-long {
    display: none;
  }

  .match__badge-short {
    display: inline;
  }

  .match__badge .ui-icon {
    display: none;
  }

  .match__title {
    color: var(--text2);
  }
}
</style>
