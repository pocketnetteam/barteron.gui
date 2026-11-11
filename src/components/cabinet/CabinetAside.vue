<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { cabinetRoute, type CabinetSection } from '@/composables/cabinet'
import { useCabinetCounts, useCabinetHead } from '@/composables/cabinet-data'
import { useProfileReviews } from '@/composables/profile-reviews'
import UiAvatar from '@/ui/UiAvatar.vue'

/** Desktop cabinet column (s5-myoffers-desktop): who I am, the balance, the sections. */
const props = defineProps<{ active: CabinetSection }>()
const { t } = useI18n()
const head = useCabinetHead()
const counts = useCabinetCounts()
const reviews = useProfileReviews(head.me)

const items = computed(() => {
  const c = counts.value
  const rows: { key: CabinetSection; count?: number | null }[] = [
    { key: 'ads', count: c.ads },
    { key: 'barters' },
    { key: 'deals' },
    { key: 'favorites', count: c.favorites },
    { key: 'viewed' },
    { key: 'votes', count: reviews.rows.value.length || null },
    { key: 'wallet' },
    { key: 'notifications' },
    { key: 'settings' },
  ]
  return rows.map((r) => ({
    ...r,
    label: t(`cabinet.sections.${r.key}`),
    to: cabinetRoute(head.me.value, r.key),
    // «Мой список» lives in the settings on a computer.
    current: props.active === r.key || (r.key === 'settings' && props.active === 'mylist'),
  }))
})
</script>

<template>
  <aside class="cside">
    <div class="cside__card">
      <div class="cside__who">
        <UiAvatar
          :name="head.name.value"
          :seed="head.me.value ?? undefined"
          :src="head.avatar.value"
          :size="56"
        />
        <div class="cside__text">
          <span class="cside__name">{{ head.name.value }}</span>
          <span class="cside__rating">{{ head.rating.value }}</span>
          <RouterLink class="cside__link" :to="cabinetRoute(head.me.value, 'public')">
            {{ t('cabinet.myPublicProfile') }}
          </RouterLink>
        </div>
      </div>
      <RouterLink class="cside__balance" :to="cabinetRoute(head.me.value, 'wallet')">
        <span class="cside__balance-label">{{ t('cabinet.balance') }}</span>
        <span class="cside__balance-sum">{{ head.pkoin.value ?? '—' }}</span>
      </RouterLink>
    </div>
    <nav class="cside__nav" :aria-label="t('cabinet.nav')" data-testid="cabinet-nav">
      <RouterLink
        v-for="item in items"
        :key="item.key"
        class="cside__item"
        :class="{ 'cside__item--on': item.current }"
        :to="item.to"
        :aria-current="item.current ? 'page' : undefined"
        :data-testid="`cabinet-nav-${item.key}`"
      >
        <span>{{ item.label }}</span>
        <span v-if="item.count" class="cside__count">{{ item.count }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.cside {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cside__card,
.cside__nav {
  border-radius: 20px;
  background: var(--surface);
}

.cside__card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cside__who {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cside__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cside__name {
  font-size: 16px;
  line-height: 21px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cside__rating {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.cside__link {
  font-size: 13px;
  line-height: 18px;
  color: var(--link);
}

.cside__balance {
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--pkoin-soft);
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.cside__balance:hover {
  text-decoration: none;
  filter: brightness(0.98);
}

.cside__balance-label {
  font-size: 13px;
  color: var(--text2);
}

.cside__balance-sum {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cside__nav {
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.cside__item {
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-m);
  color: var(--text);
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-decoration: none;
}

.cside__item:hover {
  background: var(--subtle);
  text-decoration: none;
}

.cside__item--on,
.cside__item--on:hover {
  background: var(--primary-soft);
  color: var(--link);
  font-weight: 600;
}

.cside__count {
  font-size: 13px;
  font-weight: 500;
  color: var(--text3);
}

.cside__balance:focus-visible,
.cside__item:focus-visible,
.cside__link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
