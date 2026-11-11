<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useOffer } from '@/api/queries'
import ChainCard from '@/components/exchange/ChainCard.vue'
import DirectMatchCard from '@/components/exchange/DirectMatchCard.vue'
import { editListRoute, offerRoute } from '@/components/exchange/exchange-ui'
import ProposeDialog from '@/components/exchange/ProposeDialog.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useLocationLabel } from '@/components/layout/location-label'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import ExchangeList from '@/components/offer/ExchangeList.vue'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import { isBanned } from '@/config/ban'
import { cabinetRoute } from '@/composables/cabinet'
import { exchangeMessages, useChat } from '@/composables/chat'
import { useOfferExchanges, usePeople } from '@/composables/exchanges'
import { useCityName } from '@/composables/place-name'
import { exchangeCategories, isOfferActive, type Offer } from '@/models/offer'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'
import UiAlert from '@/ui/UiAlert.vue'
import UiBreadcrumbs from '@/ui/UiBreadcrumbs.vue'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiSpinner from '@/ui/UiSpinner.vue'

const PAGE = 12

/**
 * `/barter/exchange/:id` (old route «Варианты обмена»; s6-offer-desktop /
 * -mobile): direct exchanges and chains of three for my offer. Someone
 * else's offer shows its options without «Предложить»: the old page did not
 * check whose offer it was.
 */
const route = useRoute()
const { t } = useI18n()
const session = useSessionStore()
const ui = useUiStore()
const context = useCardContext()
const areaLabel = useLocationLabel()
const chat = useChat()

const id = computed(() => String(route.params.id ?? ''))
const query = useOffer(id)
const offer = computed(() => {
  const o = query.data.value
  return o && !isBanned(o.address) && o.published !== 'removed' ? o : null
})
const mine = computed(() => !!offer.value && offer.value.address === session.address)
const active = computed(() => !!offer.value && isOfferActive(offer.value))

const ex = useOfferExchanges(() => (active.value ? offer.value : null))
const state = computed(() => ex.state.value)
const ownerList = computed(() => ex.ownerList.value ?? [])
const wish = computed(() => (offer.value ? exchangeCategories(offer.value, ownerList.value) : []))
const direct = computed(() => state.value?.exchanges?.direct ?? [])
const chains = computed(() => state.value?.exchanges?.chains ?? [])
const shown = ref(PAGE)
const visibleDirect = computed(() => direct.value.slice(0, shown.value))

const people = usePeople(() => [
  ...direct.value.map((o) => o.address),
  ...chains.value.flatMap((c) => [c.via.address, c.target.address]),
])
const names = computed(() => new Map([...people.value].map(([a, p]) => [a, p.name])))

const card = computed(() =>
  offer.value
    ? offerCardData(offer.value, { ...context.value, sellerList: ex.ownerList.value ?? undefined })
    : null
)
const city = useCityName(() => offer.value?.geohash)
const page = computed(() => {
  if (offer.value) return 'ready'
  if (query.isPending.value && session.status !== 'failed') return 'loading'
  return query.isError.value ? 'error' : 'missing'
})

const crumbs = computed(() => [
  { label: t('cabinet.nav'), to: cabinetRoute(session.address) },
  { label: t('cabinet.sections.barters'), to: cabinetRoute(session.address, 'barters') },
  { label: offer.value?.caption ?? '' },
])

const noList = computed(() => {
  const reason = state.value?.status === 'none' ? state.value.reason : null
  if (!reason || !offer.value) return null
  return {
    text: t(`exchanges.noList.${reason}`, { title: offer.value.caption }),
    action:
      !mine.value || reason === 'notExchangeable'
        ? null
        : reason === 'emptyMyList'
          ? { label: t('exchanges.noList.myList'), to: cabinetRoute(session.address, 'mylist') }
          : { label: t('exchanges.noList.action'), to: editListRoute(id.value) },
  }
})

// ─── «Предложить обмен» ─────────────────────────────────────────────────────
const proposing = ref<Offer | null>(null)
const proposeOpen = computed({
  get: () => proposing.value !== null,
  set: (value) => {
    if (!value && !chat.opening.value) proposing.value = null
  },
})
const proposal = computed(() => {
  const target = proposing.value
  if (!target || !offer.value) return null
  const person = people.value.get(target.address)
  return {
    source: offer.value,
    target,
    seller: { name: person?.name || t('exchanges.someone'), avatar: person?.avatar ?? null },
  }
})

/**
 * The same chat as «Предложить обмен» on their offer (stage 4): a room named
 * after my offer, links to mine and theirs, «Предлагаю обмен». The old page
 * sent only the link to mine.
 */
async function propose() {
  const target = proposing.value
  const source = offer.value
  const sdk = session.sdk
  if (!target?.hash || !source?.hash || !sdk) return
  const ok = await chat.open({
    name: source.caption,
    members: [target.address],
    messages: exchangeMessages((p) => sdk.get.applink(p), source.hash, target.hash, t),
  })
  if (ok) proposing.value = null
}
</script>

<template>
  <AppLayout tab="exchanges">
    <template #mobile-top>
      <PageTopBar
        :title="t('exchanges.offer.title')"
        :back="mine ? cabinetRoute(session.address, 'barters') : offerRoute(id)"
      />
    </template>

    <div class="xv container" data-testid="exchange-options" :data-state="page">
      <div v-if="page === 'loading'" class="xv__loading" aria-busy="true">
        <UiSkeleton width="40%" height="14px" />
        <UiSkeleton height="160px" radius="20px" />
        <UiSkeleton height="320px" radius="20px" />
      </div>

      <div v-else-if="page !== 'ready'" class="xv__missing" data-testid="exchange-options-missing">
        <UiEmptyState
          icon="search-empty"
          :title="page === 'error' ? t('item.missing.errorTitle') : t('item.missing.title')"
          :text="page === 'error' ? t('item.missing.errorText') : t('item.missing.text')"
        />
        <div class="xv__actions">
          <UiButton variant="neutral" @click="query.refetch()">{{
            t('item.missing.refresh')
          }}</UiButton>
          <UiButton :to="{ name: 'home' }">{{ t('item.missing.home') }}</UiButton>
        </div>
      </div>

      <template v-else-if="offer && card">
        <UiBreadcrumbs v-if="mine" class="xv__crumbs" :items="crumbs" />

        <section class="xv__head">
          <RouterLink class="xv__photo" :to="offerRoute(id)" tabindex="-1" aria-hidden="true">
            <OfferPhoto :src="card.photo" ratio="4 / 3" radius="14px" />
          </RouterLink>
          <div class="xv__title-box">
            <span class="xv__for">{{ t('exchanges.offer.for') }}</span>
            <h1 class="xv__title">
              <RouterLink :to="offerRoute(id)">{{ offer.caption }}</RouterLink>
            </h1>
            <span class="xv__price">
              <PriceTag :price="card.price" :size="16" no-equivalent />
              <template v-if="city.data.value"> · {{ city.data.value }}</template>
            </span>
          </div>
          <div v-if="!card.price.free || card.exchange?.length" class="xv__wants">
            <div class="xv__wants-row">
              <span class="xv__wants-title">{{ t('exchanges.offer.wants') }}</span>
              <RouterLink v-if="mine" class="xv__link" :to="editListRoute(id)">{{
                t('exchanges.offer.edit')
              }}</RouterLink>
            </div>
            <ExchangeList
              variant="block"
              :items="card.exchange"
              :anything="card.exchangeAnything"
            />
            <span class="xv__area">
              {{ t('exchanges.areaLine', { area: areaLabel }) }} ·
              <button type="button" class="xv__link" @click="ui.openLocation()">
                {{ t('exchanges.changeArea') }}
              </button>
            </span>
          </div>
        </section>

        <UiAlert v-if="!mine" tone="info" data-testid="exchange-not-mine">{{
          t('exchanges.offer.notMine')
        }}</UiAlert>

        <UiAlert v-if="!active" tone="warning" data-testid="exchange-inactive">
          {{ t('exchanges.offer.inactive') }}
          <template #action>
            <UiButton variant="neutral" :size="36" :to="offerRoute(id)">{{
              t('exchanges.offer.toOffer')
            }}</UiButton>
          </template>
        </UiAlert>

        <UiAlert v-else-if="noList" tone="info" data-testid="exchange-no-list">
          {{ noList.text }}
          <template v-if="noList.action" #action>
            <UiButton variant="secondary" :size="36" :to="noList.action.to">{{
              noList.action.label
            }}</UiButton>
          </template>
        </UiAlert>

        <template v-else-if="state?.status === 'pending'">
          <div class="xv__wait" data-testid="exchange-loading">
            <UiSpinner :size="18" />
            {{ t('exchanges.loading') }}
          </div>
          <div class="xv__grid">
            <UiSkeleton v-for="n in 3" :key="n" height="320px" radius="18px" />
          </div>
        </template>

        <div v-else-if="state?.status === 'error'" class="xv__failed" data-testid="exchange-failed">
          <strong>{{ t('exchanges.failedTitle') }}</strong>
          <span>{{ t('exchanges.failedText') }}</span>
          <UiButton variant="contrast" :size="40" @click="ex.refetch()">{{
            t('ui.retry')
          }}</UiButton>
        </div>

        <UiEmptyState
          v-else-if="state?.status === 'ready' && !state.count"
          class="xv__empty"
          icon="exchange"
          :title="t('exchanges.hub.emptyTitle')"
          :text="t('exchanges.hub.emptyText')"
          data-testid="exchange-empty"
        >
          <UiButton v-if="mine" :to="editListRoute(id)">{{ t('exchanges.editList') }}</UiButton>
          <UiButton variant="neutral" icon="location" @click="ui.openLocation()">{{
            t('exchanges.area')
          }}</UiButton>
        </UiEmptyState>

        <template v-else-if="state?.status === 'ready'">
          <section v-if="direct.length" class="xv__section" data-testid="exchange-direct">
            <div class="xv__section-head">
              <h2>{{ t('exchanges.offer.direct', { n: direct.length }) }}</h2>
              <span>{{ t('exchanges.offer.directHint') }}</span>
            </div>
            <div class="xv__grid">
              <DirectMatchCard
                v-for="target in visibleDirect"
                :key="target.hash ?? ''"
                :source="offer"
                :source-wish="wish"
                :target="target"
                :seller="names.get(target.address)"
                :can-propose="mine"
                :busy="chat.opening.value"
                @propose="proposing = target"
              />
            </div>
            <UiButton
              v-if="direct.length > shown"
              class="xv__more"
              variant="neutral"
              :size="48"
              @click="shown += PAGE"
              >{{ t('exchanges.offer.more') }}</UiButton
            >
            <p v-else-if="state.exchanges?.more" class="xv__note">
              {{ t('exchanges.offer.firstOnly', { n: direct.length }) }}
            </p>
          </section>

          <section v-if="chains.length" class="xv__section" data-testid="exchange-chains">
            <div class="xv__section-head">
              <h2>{{ t('exchanges.offer.chains', { n: chains.length }) }}</h2>
              <span>{{ t('exchanges.offer.chainsHint') }}</span>
            </div>
            <ChainCard
              v-for="c in chains"
              :key="`${c.target.hash}:${c.via.hash}`"
              :chain="c"
              :names="names"
              :mine="mine"
            />
          </section>
        </template>
      </template>
    </div>

    <ProposeDialog
      v-model:open="proposeOpen"
      :direct="proposal"
      :sending="chat.opening.value"
      @confirm="propose"
    />
  </AppLayout>
</template>

<style scoped>
.xv {
  padding-top: 20px;
  padding-bottom: 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.xv__loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.xv__missing {
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

.xv__actions {
  display: flex;
  gap: 8px;
}

.xv__head {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}

.xv__photo {
  flex: none;
  width: 160px;
}

.xv__title-box {
  flex: 1 1 280px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.xv__for {
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: var(--text3);
}

.xv__title {
  font-size: 26px;
  line-height: 32px;
  font-weight: 700;
}

.xv__title a {
  color: var(--text);
}

.xv__title a:hover {
  color: var(--link);
}

.xv__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  font-size: 15px;
  color: var(--text2);
}

.xv__wants {
  flex: 1 1 320px;
  padding: 16px;
  border-radius: 16px;
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.xv__wants-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.xv__wants-title {
  font-size: 14px;
  font-weight: 600;
}

.xv__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 13px / 18px var(--font-sans);
  cursor: pointer;
}

.xv__area {
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.xv__wait {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text2);
}

.xv__failed {
  padding: 20px;
  border-radius: 18px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: var(--text2);
}

.xv__failed strong {
  font-size: 15px;
  color: var(--text);
}

.xv__empty {
  padding: 28px 22px;
  border-radius: 18px;
  background: var(--surface);
}

.xv__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.xv__section-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 4px 12px;
}

.xv__section-head h2 {
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
}

.xv__section-head span {
  font-size: 14px;
  color: var(--text3);
}

.xv__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 16px;
}

.xv__more {
  align-self: center;
  padding: 0 28px;
}

.xv__note {
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
  text-align: center;
}

@media (max-width: 767px) {
  .xv {
    padding-top: 12px;
    padding-bottom: 24px;
    gap: 12px;
  }

  .xv__head {
    padding: 14px;
    gap: 12px;
  }

  .xv__photo {
    width: 72px;
  }

  .xv__title-box {
    flex: 1 1 0;
    gap: 2px;
  }

  .xv__crumbs {
    display: none;
  }

  .xv__title {
    font-size: 16px;
    line-height: 21px;
    font-weight: 600;
  }

  .xv__for {
    display: none;
  }

  .xv__wants {
    flex-basis: 100%;
    padding: 0;
    background: none;
  }

  .xv__section-head h2 {
    font-size: 18px;
    line-height: 24px;
  }

  .xv__section-head span {
    display: none;
  }

  .xv__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
}
</style>
