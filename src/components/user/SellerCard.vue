<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import BastyonLink from '@/components/BastyonLink.vue'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiBadge, { type BadgeTone } from '@/ui/UiBadge.vue'
import UiIcon from '@/ui/UiIcon.vue'
import type { IconName } from '@/ui/icons'
import UiRating from '@/ui/UiRating.vue'

/** Seller block on the item page (principle 06: roles and fees are visible where you decide). */
defineProps<{
  name: string
  /** Address: picks the avatar colour. */
  seed?: string
  avatar?: string | null
  role?: 'guarantor' | 'moderator'
  rating?: number
  reviews?: number
  /** «На Barteron с марта 2023» — formatted by the caller. */
  since?: string
  badges?: { label: string; tone?: BadgeTone; icon?: IconName }[]
  profileTo?: RouteLocationRaw
  reviewsTo?: RouteLocationRaw
}>()
defineEmits<{ openBastyon: [] }>()
const { t } = useI18n()
</script>

<template>
  <section class="seller" :aria-label="t('seller.title')">
    <div class="seller__head">
      <UiAvatar :name="name" :seed="seed" :src="avatar" :size="56" :role="role" />
      <div class="seller__who">
        <RouterLink v-if="profileTo" :to="profileTo" class="seller__name">{{ name }}</RouterLink>
        <span v-else class="seller__name">{{ name }}</span>
        <UiRating
          v-if="rating !== undefined"
          :value="rating"
          :count="reviews"
          :to="reviewsTo"
          variant="compact"
        />
        <span v-if="since" class="seller__since">{{ since }}</span>
      </div>
    </div>
    <div v-if="badges?.length" class="seller__badges">
      <UiBadge
        v-for="(badge, i) in badges"
        :key="i"
        :tone="badge.tone ?? 'neutral'"
        :icon="badge.icon"
        >{{ badge.label }}</UiBadge
      >
    </div>
    <div class="seller__links">
      <RouterLink v-if="profileTo" :to="profileTo" class="seller__link">
        {{ t('seller.allOffers') }}
        <UiIcon name="chevron-right" :size="18" :stroke="2" />
      </RouterLink>
      <BastyonLink class="seller__link" tone="plain" @open="$emit('openBastyon')">
        {{ t('seller.bastyonProfile') }}
      </BastyonLink>
    </div>
  </section>
</template>

<style scoped>
.seller {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.seller__head {
  display: flex;
  gap: 14px;
  align-items: center;
}

.seller__who {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.seller__name {
  font-size: 17px;
  line-height: 24px;
  font-weight: 600;
  color: var(--text);
}

.seller__since {
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.seller__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.seller__links {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.seller__link {
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 20px;
  color: var(--text);
}

.seller__link :deep(.ui-icon) {
  color: var(--text3);
}
</style>
