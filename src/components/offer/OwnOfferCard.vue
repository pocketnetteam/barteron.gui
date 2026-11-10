<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import UiBadge from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'
import OfferPhoto from './OfferPhoto.vue'
import PriceTag from './PriceTag.vue'
import type { OfferPrice } from './types'

/** My offer in the cabinet: status, notes and actions (slot). */
defineProps<{
  title: string
  to?: RouteLocationRaw
  photo?: string | null
  price: OfferPrice
  /** «Активно до 8 декабря» */
  status: { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string }
  /** Secondary notes after the status: «Автопродление». */
  notes?: string[]
}>()
defineEmits<{ more: [] }>()
const { t } = useI18n()
</script>

<template>
  <article class="own">
    <OfferPhoto class="own__photo" :src="photo" radius="10px" />
    <div class="own__body">
      <div class="own__head">
        <RouterLink v-if="to" :to="to" class="own__title">{{ title }}</RouterLink>
        <span v-else class="own__title">{{ title }}</span>
        <UiButton
          variant="ghost"
          :size="32"
          icon="more"
          :label="t('offer.moreActions')"
          @click="$emit('more')"
        />
      </div>
      <PriceTag :price="price" :size="16" no-equivalent />
      <div class="own__status">
        <UiBadge class="own__badge" :class="`own__badge--${status.tone}`" dot>{{
          status.label
        }}</UiBadge>
        <span v-for="(note, i) in notes" :key="i">{{ note }}</span>
      </div>
      <div v-if="$slots.default" class="own__actions"><slot /></div>
    </div>
  </article>
</template>

<style scoped>
.own {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: var(--radius-l);
  background: var(--surface);
  box-shadow: var(--shadow-1);
}

.own__photo {
  flex: none;
  width: 112px;
  align-self: flex-start;
}

.own__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.own__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.own__title {
  font-size: 15px;
  line-height: 20px;
  color: var(--link);
  overflow-wrap: anywhere;
}

span.own__title {
  color: var(--text);
}

.own__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

/* A plain coloured status with a dot, no background. */
.own .own__badge {
  padding: 0;
  background: none;
}

.own .own__badge--success {
  color: var(--success);
}
.own .own__badge--warning {
  color: var(--warning);
}
.own .own__badge--danger {
  color: var(--danger);
}
.own .own__badge--neutral {
  color: var(--text3);
}

.own__actions {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
