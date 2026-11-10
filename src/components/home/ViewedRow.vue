<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBarteron } from '@/api/queries'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferMini from '@/components/offer/OfferMini.vue'
import { useSoon } from '@/composables/catalog-nav'
import { useViewedStore } from '@/stores/viewed'
import HomeCarousel from './HomeCarousel.vue'

/**
 * «Вы смотрели»: ids from this device, offers from the node in the same
 * order. Ids the node no longer knows are dropped, as the old app did.
 */
const { t } = useI18n()
const viewed = useViewedStore()
const barteron = useBarteron()
const client = useQueryClient()
const context = useCardContext()
const soon = useSoon()

const ids = computed(() => [...viewed.ids])
const query = useQuery({
  queryKey: computed(() => ['barteron', 'viewed', ids.value]),
  enabled: computed(() => !!barteron.value && ids.value.length > 0),
  queryFn: async () => {
    const offers = await barteron.value!.api.offersByIds(ids.value)
    for (const o of offers) if (o.hash) client.setQueryData(['barteron', 'offer', o.hash], o)
    return offers
  },
  staleTime: 5 * 60_000,
})

watch(
  () => query.data.value,
  (offers) => {
    if (offers && query.isSuccess.value) viewed.keepOnly(offers.map((o) => o.hash ?? ''))
  }
)

const cards = computed(() =>
  (query.data.value ?? []).map((o) => ({
    id: o.hash ?? o.txHash ?? '',
    data: offerCardData(o, context.value),
  }))
)
</script>

<template>
  <section v-if="cards.length" class="viewed" data-testid="viewed">
    <div class="viewed__head">
      <h2 class="viewed__title">{{ t('home.viewed') }}</h2>
      <button type="button" class="viewed__all" @click="soon">
        <span class="viewed__all-long">{{ t('home.viewedAll') }}</span>
        <span class="viewed__all-short">{{ t('home.all') }}</span>
      </button>
    </div>
    <HomeCarousel :label="t('home.viewed')">
      <OfferMini
        v-for="card in cards"
        :key="card.id"
        class="viewed__card"
        role="listitem"
        :title="card.data.title"
        :price="card.data.price"
        :photo="card.data.photo"
        :to="card.data.to"
      />
    </HomeCarousel>
  </section>
</template>

<style scoped>
.viewed {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.viewed__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.viewed__title {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
}

.viewed__all {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.viewed__all-short {
  display: none;
}

.viewed__card {
  width: 156px;
}

@media (max-width: 767px) {
  .viewed {
    gap: 12px;
  }

  .viewed__title {
    font-size: 20px;
    line-height: 26px;
  }

  .viewed__all-long {
    display: none;
  }

  .viewed__all-short {
    display: inline;
  }

  .viewed__card {
    width: 104px;
  }
}
</style>
