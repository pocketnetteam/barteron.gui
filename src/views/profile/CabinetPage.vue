<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import CabinetAside from '@/components/cabinet/CabinetAside.vue'
import CabinetMenu from '@/components/cabinet/CabinetMenu.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import type { TabKey } from '@/components/layout/TabBar.vue'
import { cabinetRoute, type CabinetSection } from '@/composables/cabinet'
import { usePhone } from '@/composables/media'
import { useSessionStore } from '@/stores/session'
import UiButton from '@/ui/UiButton.vue'

const SECTIONS: Record<Exclude<CabinetSection, 'public'>, Component> = {
  ads: defineAsyncComponent(() => import('@/components/cabinet/MyOffers.vue')),
  barters: defineAsyncComponent(() => import('@/components/cabinet/ExchangeHub.vue')),
  deals: defineAsyncComponent(() => import('@/components/cabinet/DealsSection.vue')),
  favorites: defineAsyncComponent(() => import('@/components/cabinet/SavedOffers.vue')),
  viewed: defineAsyncComponent(() => import('@/components/cabinet/SavedOffers.vue')),
  votes: defineAsyncComponent(() => import('@/components/cabinet/MyReviews.vue')),
  wallet: defineAsyncComponent(() => import('@/components/cabinet/WalletSection.vue')),
  notifications: defineAsyncComponent(() => import('@/components/cabinet/NotifySection.vue')),
  settings: defineAsyncComponent(() => import('@/components/cabinet/SettingsSection.vue')),
  mylist: defineAsyncComponent(() => import('@/components/cabinet/MyListSection.vue')),
}

/**
 * My cabinet (s5): the section column on a computer, the menu screen on a
 * phone (s5-cabinet-mobile). Without a section a computer opens «Мои
 * объявления», a phone opens the menu.
 */
const props = defineProps<{ section: Exclude<CabinetSection, 'public'> | null }>()
const { t } = useI18n()
const session = useSessionStore()
const phone = usePhone()

const current = computed(() => props.section ?? (phone.value ? null : 'ads'))
const view = computed(() => (current.value ? SECTIONS[current.value] : null))
const viewProps = computed(() => {
  const s = current.value
  if (s === 'favorites' || s === 'viewed') return { kind: s }
  return {}
})
/** Sections a tab of the tab bar opens are its roots: no «back». */
const tab = computed<TabKey>(() =>
  current.value === 'favorites'
    ? 'favorites'
    : current.value === 'barters'
      ? 'exchanges'
      : 'profile'
)
const isRoot = computed(() => !current.value || tab.value !== 'profile')
const title = computed(() =>
  current.value
    ? t(
        current.value === 'votes'
          ? 'cabinet.sections.votesFull'
          : current.value === 'settings'
            ? 'cabinet.settingsPhone'
            : `cabinet.sections.${current.value}`
      )
    : t('cabinet.menuTitle')
)
</script>

<template>
  <AppLayout :tab="tab">
    <template #mobile-top>
      <PageTopBar :title="title" :back="isRoot ? null : cabinetRoute(session.address)">
        <UiButton
          v-if="current === 'ads'"
          variant="ghost"
          :size="44"
          icon="plus"
          :label="t('myOffers.create')"
          :to="{ name: 'createBarter' }"
        />
      </PageTopBar>
    </template>

    <div class="cab container" data-testid="cabinet" :data-section="current ?? 'menu'">
      <CabinetAside v-if="!phone" class="cab__aside" :active="current ?? 'ads'" />
      <div class="cab__main">
        <CabinetMenu v-if="!current" />
        <component :is="view" v-else-if="view" :key="current!" v-bind="viewProps" />
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.cab {
  padding-top: 24px;
  padding-bottom: 64px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.cab__aside {
  position: sticky;
  top: 16px;
}

@media (max-width: 1023px) {
  .cab {
    grid-template-columns: 220px minmax(0, 1fr);
  }
}

@media (max-width: 767px) {
  .cab {
    padding-top: 12px;
    padding-bottom: 24px;
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
