<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useOffersByIds } from '@/api/queries'
import OfferTile from '@/components/offer/OfferTile.vue'
import { useCardContext } from '@/components/offer/card-context'
import { cabinetRoute } from '@/composables/cabinet'
import { usePhone } from '@/composables/media'
import { useProfileReviews } from '@/composables/profile-reviews'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionStore } from '@/stores/session'
import { useViewedStore } from '@/stores/viewed'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiTabs from '@/ui/UiTabs.vue'
import SectionHead from './SectionHead.vue'

/**
 * «Избранное» and «Просмотренные» (s5-favorites-desktop). Both lists live on
 * the device under the old keys; offers the node no longer has are dropped,
 * as the old app did.
 */
const props = defineProps<{ kind: 'favorites' | 'viewed' }>()
const { t } = useI18n()
const router = useRouter()
const session = useSessionStore()
const favorites = useFavoritesStore()
const viewed = useViewedStore()
const context = useCardContext()
const reviews = useProfileReviews(() => session.address)
/** On a phone these are items of the cabinet menu: no tabs. */
const phone = usePhone()

const ids = computed(() => (props.kind === 'favorites' ? favorites.ids : viewed.ids))
const query = useOffersByIds(ids)
const offers = computed(() =>
  (query.data.value ?? []).filter(
    (o) => o.published !== 'removed' && ids.value.includes(o.hash ?? '')
  )
)

watch(
  () => query.data.value,
  (found) => {
    // The previous list shown while a new one loads says nothing about new ids.
    if (!found || query.isError.value || query.isPlaceholderData.value) return
    const known = found
      .filter((o) => o.published !== 'removed')
      .flatMap((o) => (o.hash ? [o.hash] : []))
    if (props.kind === 'favorites') favorites.keepOnly(known)
    else viewed.keepOnly(known)
  }
)

type Tab = 'favorites' | 'viewed' | 'votes'
const tabs = computed(() => [
  {
    value: 'favorites' as Tab,
    label: t('cabinet.sections.favorites'),
    count: favorites.ids.length || undefined,
  },
  { value: 'viewed' as Tab, label: t('cabinet.sections.viewed') },
  {
    value: 'votes' as Tab,
    label: t('cabinet.sections.votesFull'),
    count: reviews.rows.value.length || undefined,
  },
])
const tab = computed<Tab>({
  get: () => props.kind,
  set: (value) => void router.replace(cabinetRoute(session.address, value)),
})
const empty = computed(() =>
  props.kind === 'favorites'
    ? {
        icon: 'heart' as const,
        title: t('saved.emptyFavorites.title'),
        text: t('saved.emptyFavorites.text'),
      }
    : {
        icon: 'views' as const,
        title: t('saved.emptyViewed.title'),
        text: t('saved.emptyViewed.text'),
      }
)
</script>

<template>
  <section class="saved" :data-testid="`cabinet-${kind}`">
    <SectionHead :title="t(`cabinet.sections.${kind}`)" />
    <UiTabs
      v-if="!phone"
      v-model="tab"
      class="saved__tabs"
      :items="tabs"
      :label="t('cabinet.nav')"
    />
    <p class="saved__note">{{ t('saved.note') }}</p>

    <UiEmptyState
      v-if="!ids.length"
      :icon="empty.icon"
      :title="empty.title"
      :text="empty.text"
      data-testid="saved-empty"
    >
      <UiButton variant="neutral" :to="{ name: 'home' }">{{ t('saved.toOffers') }}</UiButton>
    </UiEmptyState>

    <UiAlert v-else-if="query.isError.value" tone="danger" :title="t('saved.error')">
      <template #action>
        <UiButton variant="on-danger" :size="36" @click="query.refetch()">{{
          t('ui.retry')
        }}</UiButton>
      </template>
    </UiAlert>

    <div v-else class="saved__grid">
      <template v-if="query.isPending.value">
        <UiSkeleton v-for="i in Math.min(ids.length, 8)" :key="i" ratio="3 / 4" radius="16px" />
      </template>
      <OfferTile
        v-for="offer in offers"
        v-else
        :key="offer.hash!"
        :offer="offer"
        :context="context"
      />
    </div>
  </section>
</template>

<style scoped>
.saved {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.saved__note {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.saved__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px 16px;
}

@media (max-width: 767px) {
  .saved__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 12px;
  }
}
</style>
