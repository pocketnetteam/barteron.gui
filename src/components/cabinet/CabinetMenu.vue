<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAccount } from '@/api/queries'
import { cabinetRoute, type CabinetSection } from '@/composables/cabinet'
import { useCabinetCounts, useCabinetHead } from '@/composables/cabinet-data'
import { useBastyonProfile } from '@/composables/bastyon'
import { useProfileReviews } from '@/composables/profile-reviews'
import { SUPPORT_EMAIL } from '@/config/roles'
import { useNotifyPrefsStore } from '@/stores/notify-prefs'
import { useSessionStore } from '@/stores/session'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiIcon from '@/ui/UiIcon.vue'

/** Phone cabinet (s5-cabinet-mobile): who I am, the wallet, sections in three groups. */
const { t } = useI18n()
const session = useSessionStore()
const head = useCabinetHead()
const counts = useCabinetCounts()
const reviews = useProfileReviews(head.me)
const account = useAccount(head.me)
const prefs = useNotifyPrefsStore()
const openBastyon = useBastyonProfile()

interface Row {
  key: CabinetSection | 'bastyon' | 'support'
  label: string
  count?: number | null
  external?: boolean
}

const groups = computed<Row[][]>(() => {
  const c = counts.value
  const label = (key: CabinetSection) => t(`cabinet.sections.${key}`)
  return [
    [
      { key: 'ads', label: label('ads'), count: c.ads },
      { key: 'barters', label: label('barters') },
      { key: 'deals', label: label('deals') },
    ],
    [
      { key: 'favorites', label: label('favorites'), count: c.favorites },
      { key: 'viewed', label: label('viewed') },
      {
        key: 'votes',
        label: t('cabinet.sections.votesFull'),
        count: reviews.rows.value.length || null,
      },
    ],
    [
      { key: 'notifications', label: label('notifications') },
      { key: 'mylist', label: label('mylist'), count: account.data.value?.tags.length || null },
      { key: 'settings', label: label('settings') },
      { key: 'bastyon', label: t('cabinet.bastyonProfile'), external: true },
      { key: 'support', label: t('cabinet.support') },
    ],
  ]
})

const isSection = (key: Row['key']): key is CabinetSection => key !== 'bastyon' && key !== 'support'

function act(key: Row['key']) {
  if (key === 'bastyon' && head.me.value)
    void openBastyon(head.me.value, head.profile.data.value?.name)
  else if (key === 'support')
    void session.sdk?.openExternalLink(`mailto:${SUPPORT_EMAIL}`).catch(() => undefined)
}
</script>

<template>
  <div class="cmenu" data-testid="cabinet-menu">
    <RouterLink class="cmenu__card cmenu__who" :to="cabinetRoute(head.me.value, 'public')">
      <UiAvatar
        :name="head.name.value"
        :seed="head.me.value ?? undefined"
        :src="head.avatar.value"
        :size="64"
      />
      <span class="cmenu__text">
        <span class="cmenu__name">{{ head.name.value }}</span>
        <span class="cmenu__sub">{{ head.rating.value }}</span>
        <span class="cmenu__link">{{ t('cabinet.publicProfile') }}</span>
      </span>
      <UiIcon name="chevron-right" :size="20" :stroke="2" class="cmenu__chev" />
    </RouterLink>

    <RouterLink
      class="cmenu__card cmenu__wallet"
      :to="cabinetRoute(head.me.value, 'wallet')"
      data-testid="cabinet-menu-wallet"
    >
      <UiIcon name="pkoin" :size="30" :stroke="1.8" class="cmenu__pkoin" />
      <span class="cmenu__text">
        <span class="cmenu__sum">{{ head.pkoin.value ?? t('profileMenu.balanceUnknown') }}</span>
        <span class="cmenu__sub">{{
          [head.equivalent.value, t('cabinet.sections.wallet')].filter(Boolean).join(' · ')
        }}</span>
      </span>
      <UiIcon name="chevron-right" :size="20" :stroke="2" class="cmenu__chev" />
    </RouterLink>

    <RouterLink
      v-if="prefs.showReminder"
      class="cmenu__hint"
      :to="cabinetRoute(head.me.value, 'notifications')"
      data-testid="cabinet-notify-hint"
    >
      <UiIcon name="bell" :size="20" />
      <span>{{ t('cabinet.notifyHint') }}</span>
    </RouterLink>

    <nav class="cmenu__groups" :aria-label="t('cabinet.nav')">
      <div v-for="(group, i) in groups" :key="i" class="cmenu__group">
        <template v-for="row in group" :key="row.key">
          <RouterLink
            v-if="isSection(row.key)"
            class="cmenu__row"
            :to="cabinetRoute(head.me.value, row.key)"
            :data-testid="`cabinet-menu-${row.key}`"
          >
            <span class="cmenu__label">{{ row.label }}</span>
            <span v-if="row.count" class="cmenu__count">{{ row.count }}</span>
            <UiIcon name="chevron-right" :size="18" :stroke="2" class="cmenu__chev" />
          </RouterLink>
          <button v-else type="button" class="cmenu__row" @click="act(row.key)">
            <span class="cmenu__label">{{ row.label }}{{ row.external ? ' ↗' : '' }}</span>
            <UiIcon name="chevron-right" :size="18" :stroke="2" class="cmenu__chev" />
          </button>
        </template>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.cmenu {
  padding: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cmenu__card {
  padding: 16px;
  border-radius: 20px;
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
}

.cmenu__card:hover {
  text-decoration: none;
}

.cmenu__wallet {
  background: var(--pkoin-soft);
}

.cmenu__pkoin {
  color: var(--pkoin);
  flex: none;
}

.cmenu__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cmenu__name {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cmenu__sum {
  font-size: 20px;
  line-height: 26px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.cmenu__sub {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.cmenu__link {
  font-size: 13px;
  line-height: 18px;
  color: var(--link);
}

.cmenu__chev {
  flex: none;
  color: var(--text2);
}

.cmenu__hint {
  padding: 14px 16px;
  border-radius: var(--radius-l);
  background: var(--info-soft);
  color: var(--text);
  font-size: 14px;
  line-height: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.cmenu__hint :deep(svg) {
  flex: none;
  color: var(--info);
}

.cmenu__groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cmenu__group {
  border-radius: 20px;
  background: var(--surface);
  overflow: hidden;
}

.cmenu__row {
  width: 100%;
  min-height: 54px;
  padding: 0 16px;
  border: 0;
  border-top: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font: 400 16px / 22px var(--font-sans);
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.cmenu__row:first-child {
  border-top: 0;
}

.cmenu__row:hover {
  text-decoration: none;
  background: var(--subtle);
}

.cmenu__label {
  flex: 1;
  min-width: 0;
}

.cmenu__count {
  font-size: 14px;
  color: var(--text3);
}

.cmenu__card:focus-visible,
.cmenu__hint:focus-visible,
.cmenu__row:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px var(--ring);
}
</style>
