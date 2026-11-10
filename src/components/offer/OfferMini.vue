<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import OfferPhoto from './OfferPhoto.vue'
import PriceTag from './PriceTag.vue'
import type { OfferPrice } from './types'

/** Compact card for carousels («Вы смотрели», «Может подойти»). */
defineProps<{ title: string; price: OfferPrice; photo?: string | null; to?: RouteLocationRaw }>()
</script>

<template>
  <article class="mini">
    <OfferPhoto :src="photo" ratio="1 / 1" radius="10px" />
    <PriceTag :price="price" :size="14" no-equivalent />
    <RouterLink v-if="to" :to="to" class="mini__title">{{ title }}</RouterLink>
    <span v-else class="mini__title">{{ title }}</span>
  </article>
</template>

<style scoped>
.mini {
  position: relative;
  width: 132px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini__title {
  font-size: 13px;
  line-height: 17px;
  color: var(--text2);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

a.mini__title::after {
  content: '';
  position: absolute;
  inset: 0;
}

a.mini__title:hover {
  text-decoration: none;
  color: var(--link);
}
</style>
