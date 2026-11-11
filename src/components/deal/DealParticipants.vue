<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DealRole } from '@/models/safe-deal'
import UiAvatar from '@/ui/UiAvatar.vue'

export interface DealPerson {
  role: DealRole
  address: string
  name: string
  avatar: string | null
  you: boolean
  /** On the right: «4,9 ★» for the seller, «комиссия 2%» for the guarantor. */
  meta?: string
}

/** «Участники» of a deal (s7-dealbuyer). */
defineProps<{ people: DealPerson[]; titled?: boolean }>()
const { t } = useI18n()
</script>

<template>
  <section class="dp" data-testid="deal-participants">
    <h2 v-if="titled" class="dp__title">{{ t('deal.aside.participants') }}</h2>
    <ul class="dp__list">
      <li v-for="p in people" :key="p.role" class="dp__row" :data-role="p.role">
        <UiAvatar
          :size="40"
          :name="p.you ? t('deal.you') : p.name"
          :src="p.avatar"
          :seed="p.address"
        />
        <span class="dp__who">
          <span class="dp__role">{{ t(`deal.role.${p.role}`) }}</span>
          <span class="dp__name">{{ p.you ? t('deal.you') : p.name }}</span>
        </span>
        <span v-if="p.meta" class="dp__meta">{{ p.meta }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.dp {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dp__title {
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
}

.dp__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dp__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dp__who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.dp__role {
  color: var(--text2);
  font-size: 12px;
  line-height: 16px;
}

.dp__name {
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dp__meta {
  flex: none;
  color: var(--text2);
  font-size: 12px;
  line-height: 16px;
}

@media (max-width: 767px) {
  .dp__list {
    gap: 0;
  }

  .dp__row {
    padding: 10px 0;
  }

  .dp__row + .dp__row {
    border-top: 1px solid var(--border);
  }
}
</style>
