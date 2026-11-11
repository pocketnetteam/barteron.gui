<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import type { Offer } from '@/models/offer'

/**
 * A found exchange in the exchanges section (s6-hub): the offer I would get,
 * how (direct or a chain), and where it leads — the offer or the chain.
 */
const props = defineProps<{
  offer: Offer
  kind: 'direct' | 'chain'
  to: RouteLocationRaw
  /** «Таганская · 3,2 км», «через „Самокат“». */
  meta?: string | null
  /** Small cards in a row on a phone (s6-hub-mobile). */
  compact?: boolean
}>()
const { t } = useI18n()
const context = useCardContext()
const card = computed(() => offerCardData(props.offer, context.value))
</script>

<template>
  <article
    class="xt"
    :class="{ 'xt--compact': compact }"
    data-testid="exchange-tile"
    :data-kind="kind"
  >
    <OfferPhoto :src="card.photo" ratio="4 / 3" :radius="compact ? '10px' : '12px'">
      <template #top-left>
        <span class="xt__badge" :class="`xt__badge--${kind}`">{{
          t(compact ? `match.${kind}Short` : `match.${kind}`)
        }}</span>
      </template>
    </OfferPhoto>
    <PriceTag :price="card.price" :size="compact ? 14 : 16" no-equivalent />
    <RouterLink class="xt__title" :to="to">{{ card.title }}</RouterLink>
    <span v-if="meta" class="xt__meta">{{ meta }}</span>
  </article>
</template>

<style scoped>
.xt {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.xt__badge {
  display: inline-flex;
  padding: 3px 7px;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: #ffffff;
  font-size: 11px;
  line-height: 14px;
  font-weight: 600;
}

.xt__badge--chain {
  background: var(--contrast);
  color: var(--on-contrast);
}

.xt__title {
  font-size: 14px;
  line-height: 18px;
  color: var(--link);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.xt__title::after {
  content: '';
  position: absolute;
  inset: 0;
}

.xt__title:focus-visible {
  outline: none;
}

.xt:focus-within {
  border-radius: 12px;
  box-shadow: 0 0 0 3px var(--ring);
}

.xt__meta {
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.xt--compact {
  flex: none;
  width: 136px;
  gap: 4px;
}

.xt--compact .xt__badge {
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
}

.xt--compact .xt__title {
  font-size: 13px;
  line-height: 16px;
}
</style>
