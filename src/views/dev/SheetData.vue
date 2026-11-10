<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  pagesOffers,
  useAccount,
  useCategories,
  useFeed,
  useOffersByAddress,
  useRates,
} from '@/api/queries'
import { currenciesFor } from '@/api/rates'
import type { CardContext } from '@/components/offer/card-data'
import NetStatusBadge from '@/components/net/NetStatusBadge.vue'
import { encodeGeohash } from '@/lib/geohash'
import { formatAgo, formatMoney, formatPkoin } from '@/lib/format'
import { emptyOffer, toOfferPayload } from '@/models/offer'
import { useCurrencyStore } from '@/stores/currency'
import { useSessionStore } from '@/stores/session'
import { etaMinutes, netStatusOf, useTxStore } from '@/stores/tx'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiSelect from '@/ui/UiSelect.vue'
import DataCard from './DataCard.vue'
import ShowSection from './ShowSection.vue'

/**
 * Stage 2 at work: the feed, my offers and publishing read and write through
 * the data layer. In a plain browser everything goes to the mock network
 * (`src/sdk/mock-network.ts`): a block comes four seconds after sending.
 */

const { locale } = useI18n()
const session = useSessionStore()
const currency = useCurrencyStore()
const tx = useTxStore()
const categories = useCategories()
const rates = useRates()

const feed = useFeed({ pageSize: 4 })
const feedOffers = computed(() => pagesOffers(feed.data.value))
const me = computed(() => session.address)
const myAccount = useAccount(me)
const myOffers = useOffersByAddress(me)

const myCategories = computed(
  () => new Set((myOffers.data.value ?? []).flatMap((o) => (o.tag ? [o.tag] : [])))
)

const context = computed<CardContext>(() => ({
  categoryLabel: (id) => categories.label(id),
  rates: rates.data.value,
  currency: currency.code,
  myCategories: myCategories.value,
  viewer: session.address,
  formatTime: (ms) => formatAgo(ms, locale.value),
  imageSrc: (url) => session.sdk?.manageBastyonImageSrc(url) ?? url,
}))

/** Mine from the node, with versions on their way on top. */
const mine = computed(() => {
  const pending = tx.pendingOffers
  const pendingIds = new Set(pending.map((p) => p.offer.hash))
  return [
    ...pending.map((p) => ({ offer: p.offer, pending: true })),
    ...(myOffers.data.value ?? [])
      .filter((o) => !pendingIds.has(o.hash))
      .map((offer) => ({ offer, pending: false })),
  ]
})

const currencyOptions = computed(() =>
  currenciesFor(locale.value).map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }))
)
const currencyModel = computed({
  get: () => currency.code,
  set: (value: string) => currency.set(value),
})
const rateLine = computed(() => {
  const rate = rates.data.value?.[currency.code]
  return rate
    ? `1 PKOIN ≈ ${formatMoney(rate, currency.code, locale.value)} · 1 000 PKOIN ≈ ${formatMoney(rate * 1000, currency.code, locale.value)}`
    : null
})

let counter = 0
const sendError = ref<string | null>(null)

/** Publishes a test offer: a mountain bike, in exchange for a laptop. */
async function publish(prefix = '') {
  sendError.value = null
  const tree = categories.tree.value
  const address = session.address
  if (!address) {
    sendError.value = 'Нет адреса: войдите в Bastyon'
    return
  }
  counter += 1
  try {
    const payload = toOfferPayload(
      {
        ...emptyOffer(address, 'ru-RU'),
        caption: `${prefix}Тестовое объявление ${counter}`,
        description: 'Создано на витрине данных.',
        tag: 1006,
        tags: [58068],
        geohash: encodeGeohash([44.81, 20.46]),
        priceCents: 100000,
      },
      { isLeafCategory: tree ? (id) => tree.isLeaf(id) : undefined }
    )
    await tx.send('offer', payload)
  } catch (error) {
    sendError.value = error instanceof Error ? error.message : String(error)
  }
}

const txRows = computed(() =>
  [...tx.items].reverse().map((item) => ({
    item,
    status: netStatusOf(item),
    eta: item.status === 'waiting' ? `~${etaMinutes(item)} мин` : undefined,
    title: (item.payload as { caption?: string } | null)?.caption ?? item.kind,
  }))
)
</script>

<template>
  <div class="data">
    <ShowSection
      title="Лента"
      note="getbarteronfeed по 4, следующая страница — с той же высоты (topHeight)"
    >
      <div v-if="feed.isPending.value" class="data__muted">Загружаем…</div>
      <UiAlert v-else-if="feed.isError.value" tone="danger" title="Нода не ответила">
        {{ String(feed.error.value) }}
      </UiAlert>
      <div v-else class="data__grid" data-testid="data-feed">
        <DataCard
          v-for="offer in feedOffers"
          :key="offer.hash!"
          :offer="offer"
          :context="context"
        />
      </div>
      <div class="data__row">
        <UiButton
          v-if="feed.hasNextPage.value"
          variant="secondary"
          :size="40"
          :loading="feed.isFetchingNextPage.value"
          @click="feed.fetchNextPage()"
        >
          Показать ещё
        </UiButton>
        <span class="data__muted">
          Загружено {{ feedOffers.length }} · высота
          {{ feed.data.value?.pages[0]?.topHeight ?? '—' }}
        </span>
      </div>
    </ShowSection>

    <ShowSection
      title="Курс и валюта"
      note="coingecko + кросс-курс cryptocompare; в заглушке — постоянный"
    >
      <div class="data__row">
        <UiSelect
          v-model="currencyModel"
          :options="currencyOptions"
          label="Валюта"
          class="data__select"
        />
        <span v-if="rateLine" class="data__muted" data-testid="rate-line">{{ rateLine }}</span>
      </div>
      <UiAlert v-if="rates.isError.value" tone="warning" title="Курс не загрузился">
        Цены показаны только в PKOIN.
      </UiAlert>
    </ShowSection>

    <ShowSection
      title="Публикация и статус сети"
      note="Отправляем на ноду → ждём блок → в сети; при ошибке — повтор"
    >
      <div class="data__row">
        <UiButton :size="40" data-testid="publish" @click="publish()"
          >Опубликовать тестовое</UiButton
        >
        <UiButton :size="40" variant="neutral" @click="publish('!error ')">
          С отказом ноды
        </UiButton>
        <UiButton :size="40" variant="neutral" @click="publish('!reject ')">
          Не попадёт в блок
        </UiButton>
      </div>
      <UiAlert v-if="sendError" tone="danger" title="Не отправлено">{{ sendError }}</UiAlert>
      <ul v-if="txRows.length" class="data__txs" data-testid="tx-list">
        <li v-for="row in txRows" :key="row.item.id" class="data__tx">
          <span class="data__tx-title">{{ row.title }}</span>
          <NetStatusBadge :status="row.status" :eta="row.eta" @retry="tx.retry(row.item.id)" />
          <span v-if="row.item.error" class="data__muted">{{ row.item.error }}</span>
        </li>
      </ul>
    </ShowSection>

    <ShowSection
      title="Мои объявления"
      :note="`getbarteronoffersbyaddress + то, что ждёт блока · мой список обмена: ${(myAccount.data.value?.tags ?? []).map((id) => categories.label(id)).join(', ') || '—'}`"
    >
      <div class="data__grid" data-testid="my-offers">
        <DataCard
          v-for="entry in mine"
          :key="entry.offer.hash ?? entry.offer.caption"
          :offer="entry.offer"
          :context="context"
          :pending="entry.pending"
        />
      </div>
      <span class="data__muted">
        Цена тестового объявления — {{ formatPkoin(1000, locale) }} PKOIN.
      </span>
    </ShowSection>
  </div>
</template>

<style scoped>
.data {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.data__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px 16px;
}

.data__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}

.data__select {
  width: 180px;
}

.data__muted {
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.data__txs {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data__tx {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
}

.data__tx-title {
  min-width: 220px;
  font-size: 15px;
  font-weight: 600;
}

@media (max-width: 1099px) {
  .data__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .data__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 8px;
  }

  .data__tx-title {
    min-width: 0;
    width: 100%;
  }
}
</style>
