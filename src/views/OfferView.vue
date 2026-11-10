<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useOffer } from '@/api/queries'
import AppLayout from '@/components/layout/AppLayout.vue'
import { isBanned } from '@/config/ban'
import { isPickupPoint } from '@/models/offer'
import { useSessionStore } from '@/stores/session'
import { useTxStore } from '@/stores/tx'
import { useViewedStore } from '@/stores/viewed'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'

const OfferPage = defineAsyncComponent(() => import('./item/OfferPage.vue'))
const OwnOfferPage = defineAsyncComponent(() => import('./item/OwnOfferPage.vue'))
const PickupPointPage = defineAsyncComponent(() => import('./item/PickupPointPage.vue'))

/**
 * `/barter/:id` (old route): someone else's offer (s3-item), my own
 * (s3-itemown) or a pickup point (s3-pickup). `?view=buyer` shows my own
 * offer as buyers see it.
 */
const route = useRoute()
const { t } = useI18n()
const session = useSessionStore()
const tx = useTxStore()
const viewed = useViewedStore()

const id = computed(() => String(route.params.id ?? ''))
const query = useOffer(id)

/** My offer the node does not have yet: the version on its way. */
const pending = computed(
  () => tx.pendingOffers.find((p) => p.offer.hash === id.value)?.offer ?? null
)
const offer = computed(() => {
  const found = query.data.value
  if (found && (isBanned(found.address) || found.published === 'removed')) return null
  return found ?? pending.value
})

const state = computed(() => {
  if (offer.value) return 'ready'
  if (query.isPending.value && session.status !== 'failed') return 'loading'
  if (query.isError.value) return 'error'
  return 'missing'
})

const kind = computed(() => {
  const o = offer.value
  if (!o) return null
  if (isPickupPoint(o)) return 'pickup'
  const own = !!session.address && o.address === session.address
  return own && route.query.view !== 'buyer' ? 'own' : 'other'
})

watch(
  () => offer.value?.hash,
  (hash) => {
    if (hash) viewed.add(hash)
  },
  { immediate: true }
)
</script>

<template>
  <PickupPointPage v-if="kind === 'pickup'" :offer="offer!" />
  <OwnOfferPage v-else-if="kind === 'own'" :offer="offer!" />
  <OfferPage
    v-else-if="kind === 'other'"
    :offer="offer!"
    :preview="offer!.address === session.address"
  />

  <AppLayout v-else>
    <div class="container ov" data-testid="item-page" :data-state="state">
      <div v-if="state === 'loading'" class="ov__loading" aria-busy="true">
        <UiSkeleton width="40%" height="14px" />
        <UiSkeleton width="70%" height="32px" />
        <div class="ov__grid">
          <UiSkeleton ratio="4 / 3" radius="var(--radius-xl)" />
          <UiSkeleton height="320px" radius="var(--radius-xl)" />
        </div>
      </div>
      <div v-else class="ov__empty" data-testid="item-missing">
        <UiEmptyState
          icon="search-empty"
          :title="state === 'error' ? t('item.missing.errorTitle') : t('item.missing.title')"
          :text="state === 'error' ? t('item.missing.errorText') : t('item.missing.text')"
        />
        <div class="ov__actions">
          <UiButton variant="neutral" @click="query.refetch()">{{
            t('item.missing.refresh')
          }}</UiButton>
          <UiButton :to="{ name: 'home' }">{{ t('item.missing.home') }}</UiButton>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.ov {
  padding-top: 24px;
  padding-bottom: 48px;
}

.ov__loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ov__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
}

.ov__empty {
  max-width: 520px;
  margin: 48px auto;
  padding: 32px 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.ov__actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 767px) {
  .ov__grid {
    grid-template-columns: 1fr;
  }
}
</style>
