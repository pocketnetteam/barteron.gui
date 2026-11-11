<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ExchangeTile from '@/components/exchange/ExchangeTile.vue'
import OfferExchangesCard from '@/components/exchange/OfferExchangesCard.vue'
import { useLocationLabel } from '@/components/layout/location-label'
import { useMyExchanges, type OfferMatchState } from '@/composables/exchanges'
import { usePhone } from '@/composables/media'
import { isPickupPoint } from '@/models/offer'
import { useLocationStore } from '@/stores/location'
import { useUiStore } from '@/stores/ui'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSegmented from '@/ui/UiSegmented.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiSpinner from '@/ui/UiSpinner.vue'
import SectionHead from './SectionHead.vue'
import { chainRoute, offerRoute } from '@/components/exchange/exchange-ui'

/**
 * «Обмены» (s6-hub-desktop / -mobile): exchanges for all my offers in the
 * search area. «Подходит мне» — every offer found, once.
 */
const { t } = useI18n()
const phone = usePhone()
const ui = useUiStore()
const location = useLocationStore()
const areaLabel = useLocationLabel(', ')
const ex = useMyExchanges()

type Tab = 'offers' | 'fits'
const tab = ref<Tab>('offers')
const tabs = computed(() => [
  {
    value: 'offers' as Tab,
    label: phone.value ? t('exchanges.hub.byOffersShort') : t('exchanges.hub.byOffers'),
  },
  {
    value: 'fits' as Tab,
    label: ex.unique.value.length
      ? `${t('exchanges.hub.fits')} · ${ex.unique.value.length}`
      : t('exchanges.hub.fits'),
  },
])

const subtitle = computed(
  () =>
    `${t('exchanges.hub.text')} ${
      location.filtered
        ? t('exchanges.hub.area', { area: areaLabel.value })
        : t('exchanges.hub.everywhere')
    }`
)

/** Pickup points are not exchanged. Offers with exchanges first, then waiting, then the rest. */
const rank = (s: OfferMatchState) =>
  s.count ? 0 : s.status === 'pending' || s.status === 'error' ? 1 : s.status === 'ready' ? 2 : 3
const states = computed(() =>
  ex.states.value.filter((s) => !isPickupPoint(s.offer)).sort((a, b) => rank(a) - rank(b))
)
const myList = computed(() => ex.account.data.value?.tags ?? [])
const settled = computed(() => !ex.loadingBase.value && !ex.pending.value)
const nothingFound = computed(
  () => settled.value && states.value.length > 0 && !ex.unique.value.length
)
</script>

<template>
  <section class="xh" data-testid="cabinet-barters">
    <SectionHead :title="t('cabinet.sections.barters')" />
    <p class="xh__sub">
      {{ subtitle }}
      <button
        type="button"
        class="xh__area"
        data-testid="exchanges-area"
        @click="ui.openLocation()"
      >
        {{ t('exchanges.hub.changeArea') }}
      </button>
    </p>

    <div v-if="!phone" class="xh__kinds">
      <div class="xh__kind">
        <span class="xh__scheme" aria-hidden="true">
          <span class="xh__node xh__node--you">{{ t('exchanges.you') }}</span>
          <UiIcon name="exchange" :size="20" :stroke="2" class="xh__arrow" />
          <span class="xh__node">B</span>
        </span>
        <span class="xh__kind-text">
          <strong>{{ t('exchanges.hub.directTitle') }}</strong>
          <span>{{ t('exchanges.hub.directText') }}</span>
        </span>
      </div>
      <div class="xh__kind">
        <span class="xh__scheme xh__scheme--small" aria-hidden="true">
          <span class="xh__node xh__node--you">{{ t('exchanges.you') }}</span>
          <UiIcon name="arrow-right" :size="14" :stroke="2.4" class="xh__arrow" />
          <span class="xh__node">B</span>
          <UiIcon name="arrow-right" :size="14" :stroke="2.4" class="xh__arrow" />
          <span class="xh__node">C</span>
        </span>
        <span class="xh__kind-text">
          <strong>{{ t('exchanges.hub.chainTitle') }}</strong>
          <span>{{ t('exchanges.hub.chainText') }}</span>
        </span>
      </div>
    </div>

    <template v-if="ex.loadingBase.value">
      <div class="xh__wait">
        <UiSpinner :size="18" />
        {{ t('exchanges.loading') }}
      </div>
      <UiSkeleton v-for="n in 2" :key="n" height="180px" radius="20px" />
    </template>

    <UiEmptyState
      v-else-if="ex.offers.isError.value"
      icon="error"
      :title="t('exchanges.failedTitle')"
      :text="t('exchanges.failedText')"
    >
      <UiButton variant="contrast" @click="ex.offers.refetch()">{{ t('ui.retry') }}</UiButton>
    </UiEmptyState>

    <UiEmptyState
      v-else-if="!states.length"
      icon="exchange"
      :title="t('exchanges.hub.noOffersTitle')"
      :text="t('exchanges.hub.noOffersText')"
      data-testid="exchanges-no-offers"
    >
      <UiButton :to="{ name: 'createBarter' }">{{ t('exchanges.hub.create') }}</UiButton>
    </UiEmptyState>

    <template v-else>
      <UiSegmented
        v-model="tab"
        class="xh__tabs"
        :class="{ 'xh__tabs--block': phone }"
        :items="tabs"
        :label="t('cabinet.sections.barters')"
        data-testid="exchanges-tabs"
      />

      <div v-if="ex.pending.value" class="xh__wait" data-testid="exchanges-loading">
        <UiSpinner :size="18" />
        {{ t('exchanges.loading') }}
      </div>

      <UiEmptyState
        v-if="nothingFound"
        icon="exchange"
        :title="t('exchanges.hub.emptyTitle')"
        :text="t('exchanges.hub.emptyText')"
        data-testid="exchanges-empty"
      >
        <UiButton variant="neutral" icon="location" @click="ui.openLocation()">{{
          t('exchanges.area')
        }}</UiButton>
      </UiEmptyState>

      <div v-if="tab === 'offers'" class="xh__list" data-testid="exchanges-by-offer">
        <OfferExchangesCard
          v-for="s in states"
          :key="s.offer.hash ?? ''"
          :state="s"
          :my-list="myList"
          :phone="phone"
          @retry="ex.refetch()"
        />
      </div>

      <div v-else-if="ex.unique.value.length" class="xh__fits" data-testid="exchanges-fits">
        <ExchangeTile
          v-for="m in ex.unique.value"
          :key="m.target.hash ?? ''"
          :offer="m.target"
          :kind="m.kind"
          :to="m.chain ? chainRoute(m.chain) : offerRoute(m.target.hash ?? '')"
          :meta="t('match.for', { title: m.source.caption })"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.xh {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.xh__sub {
  margin-top: -10px;
  font-size: 15px;
  line-height: 22px;
  color: var(--text2);
}

.xh__area {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.xh__kinds {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 12px;
}

.xh__kind {
  padding: 16px;
  border-radius: 16px;
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 14px;
}

.xh__scheme {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.xh__node {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.xh__node--you {
  background: var(--primary-soft);
  color: var(--link);
}

.xh__scheme--small {
  gap: 2px;
}

.xh__scheme--small .xh__node {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  font-size: 12px;
}

.xh__arrow {
  color: var(--text3);
}

.xh__kind-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.xh__kind-text strong {
  font-size: 15px;
  line-height: 20px;
  color: var(--text);
}

.xh__tabs {
  align-self: flex-start;
}

/* On a computer each tab is as wide as its label. */
.xh__tabs:not(.xh__tabs--block) :deep(.ui-segmented__item) {
  flex: none;
  padding: 0 16px;
}

.xh__tabs--block {
  align-self: stretch;
}

.xh__wait {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text2);
}

.xh__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.xh__fits {
  padding: 18px;
  border-radius: 20px;
  background: var(--surface);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(170px, 100%), 1fr));
  gap: 16px 14px;
}

@media (max-width: 767px) {
  .xh {
    gap: 12px;
  }

  .xh__sub {
    margin-top: 0;
    font-size: 14px;
    line-height: 20px;
  }

  .xh__list {
    gap: 12px;
  }

  .xh__fits {
    padding: 14px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
