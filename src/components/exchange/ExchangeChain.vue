<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import UiIcon from '@/ui/UiIcon.vue'

export interface ChainLink {
  name: string
  item: string
  photo?: string | null
  /** The current user. */
  you?: boolean
}

/** Three-way exchange: «вы → он → третий → вы». */
defineProps<{ links: ChainLink[] }>()
const { t } = useI18n()
</script>

<template>
  <ol class="chain" :aria-label="t('exchange.chain')">
    <template v-for="(link, i) in links" :key="i">
      <li class="chain__link">
        <OfferPhoto class="chain__photo" :src="link.photo" ratio="1 / 1" :highlight="link.you" />
        <span class="chain__name">{{ link.name }}</span>
        <span class="chain__item">{{ link.item }}</span>
      </li>
      <li v-if="i < links.length - 1" class="chain__arrow" aria-hidden="true">
        <UiIcon name="arrow-right" :size="24" :stroke="2" />
      </li>
    </template>
  </ol>
</template>

<style scoped>
.chain {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chain__link {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  min-width: 0;
}

.chain__photo {
  width: 64px;
}

.chain__photo :deep(.ui-icon) {
  width: 24px;
  height: 24px;
}

.chain__name {
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
}

.chain__item {
  font-size: 11px;
  line-height: 14px;
  color: var(--text3);
}

.chain__arrow {
  flex: none;
  color: var(--link);
}
</style>
