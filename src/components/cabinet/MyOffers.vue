<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMyDrafts } from '@/composables/cabinet'
import { useMyOffers, type MyOfferItem } from '@/composables/cabinet-data'
import { usePhone } from '@/composables/media'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiSelect from '@/ui/UiSelect.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiTabs from '@/ui/UiTabs.vue'
import DraftRow from './DraftRow.vue'
import MyOfferRow from './MyOfferRow.vue'
import SectionHead from './SectionHead.vue'

/** «Мои объявления» (s5-myoffers): active, being published, inactive and drafts. */
const { t } = useI18n()
const session = useSessionStore()
const mine = useMyOffers()
const drafts = useMyDrafts(() => session.address)
/** The phone screen has no sorting (s5-myoffers-mobile): tabs right under the top bar. */
const phone = usePhone()

type Tab = 'active' | 'publishing' | 'inactive' | 'drafts'
type Sort = 'new' | 'old' | 'expiring'
const tab = ref<Tab>('active')
const sort = ref<Sort>('new')

/** Edit drafts made from the current version only: the form ignores older ones. */
const draftList = computed(() => {
  const all = mine.query.data.value ?? []
  return drafts.entries.value.filter((e) => {
    if (!e.hash) return true
    const offer = all.find((o) => o.hash === e.hash)
    return !!offer && offer.published !== 'removed' && offer.txHash === e.draft.baseTxHash
  })
})

const order = (items: MyOfferItem[]): MyOfferItem[] => {
  const list = [...items]
  if (sort.value === 'old') return list.sort((a, b) => a.offer.time - b.offer.time)
  if (sort.value === 'expiring') return list.sort((a, b) => a.offer.till - b.offer.till)
  return list.sort((a, b) => b.offer.time - a.offer.time)
}

const g = computed(() => mine.groups.value)
const tabs = computed(() => [
  { value: 'active' as const, label: t('myOffers.tabs.active'), count: g.value.active.length },
  ...(g.value.publishing.length
    ? [
        {
          value: 'publishing' as const,
          label: t('myOffers.tabs.publishing'),
          count: g.value.publishing.length,
        },
      ]
    : []),
  {
    value: 'inactive' as const,
    label: t('myOffers.tabs.inactive'),
    count: g.value.inactive.length,
  },
  { value: 'drafts' as const, label: t('myOffers.tabs.drafts'), count: draftList.value.length },
])
const sorts = computed(() => [
  { value: 'new' as const, label: t('myOffers.sort.new') },
  { value: 'old' as const, label: t('myOffers.sort.old') },
  { value: 'expiring' as const, label: t('myOffers.sort.expiring') },
])

const rows = computed(() =>
  tab.value === 'drafts' ? [] : order(g.value[tab.value as Exclude<Tab, 'drafts'>] ?? [])
)
const nothing = computed(
  () =>
    !!mine.query.data.value &&
    !g.value.active.length &&
    !g.value.publishing.length &&
    !g.value.inactive.length &&
    !draftList.value.length
)

// Open where there is something: only inactive ones → that tab (old profile did the same).
let picked = false
watch(
  () => [mine.query.data.value, g.value.publishing.length] as const,
  () => {
    if (picked || !mine.query.data.value) return
    picked = true
    if (g.value.publishing.length) tab.value = 'publishing'
    else if (!g.value.active.length && g.value.inactive.length) tab.value = 'inactive'
    else if (!g.value.active.length && draftList.value.length) tab.value = 'drafts'
  },
  { immediate: true }
)
// A tab that empties (the last offer got published) gives way to «Активные».
watch(
  () => g.value.publishing.length,
  (n) => {
    if (!n && tab.value === 'publishing') tab.value = 'active'
  }
)

onMounted(() => drafts.refresh())
</script>

<template>
  <section class="mys" data-testid="cabinet-ads">
    <SectionHead :title="t('cabinet.sections.ads')">
      <UiSelect
        v-if="!nothing && !phone"
        v-model="sort"
        class="mys__sort"
        :options="sorts"
        :label="t('myOffers.sort.label')"
        :size="44"
      />
    </SectionHead>

    <UiAlert v-if="mine.query.isError.value" tone="danger" :title="t('myOffers.error')">
      <template #action>
        <UiButton variant="on-danger" :size="36" @click="mine.query.refetch()">{{
          t('ui.retry')
        }}</UiButton>
      </template>
    </UiAlert>

    <div v-else-if="mine.query.isPending.value" class="mys__list">
      <UiSkeleton v-for="i in 3" :key="i" height="172px" radius="16px" />
    </div>

    <UiEmptyState
      v-else-if="nothing"
      icon="exchange"
      :title="t('myOffers.empty.title')"
      :text="t('myOffers.empty.text')"
      data-testid="my-offers-empty"
    >
      <UiButton :to="{ name: 'createBarter' }">{{ t('myOffers.empty.action') }}</UiButton>
    </UiEmptyState>

    <template v-else>
      <UiTabs v-model="tab" class="mys__tabs" :items="tabs" :label="t('myOffers.tabs.label')" />
      <div v-if="tab === 'drafts'" class="mys__list">
        <DraftRow
          v-for="entry in draftList"
          :key="entry.key"
          :entry="entry"
          @remove="drafts.remove(entry)"
        />
        <p v-if="!draftList.length" class="mys__none">{{ t('myOffers.emptyTab.drafts') }}</p>
      </div>
      <div v-else class="mys__list">
        <MyOfferRow v-for="item in rows" :key="item.offer.hash ?? item.tx?.id" :item="item" />
        <p v-if="!rows.length" class="mys__none">{{ t(`myOffers.emptyTab.${tab}`) }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.mys {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mys__sort {
  width: 200px;
}

.mys__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mys__none {
  margin: 0;
  padding: 28px 16px;
  border-radius: var(--radius-l);
  background: var(--subtle);
  color: var(--text2);
  font-size: 15px;
  text-align: center;
}
</style>
