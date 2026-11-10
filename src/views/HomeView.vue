<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import OfferList from '@/components/catalog/OfferList.vue'
import RatesNotice from '@/components/catalog/RatesNotice.vue'
import CategoryTiles from '@/components/home/CategoryTiles.vue'
import HomeBanners from '@/components/home/HomeBanners.vue'
import HomeCarousel from '@/components/home/HomeCarousel.vue'
import MatchCard from '@/components/home/MatchCard.vue'
import ViewedRow from '@/components/home/ViewedRow.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAreaPhrase, useLocationLabel } from '@/components/layout/location-label'
import { useSoon } from '@/composables/catalog-nav'
import { useCatalogList } from '@/composables/catalog-list'
import { useMayMatch } from '@/composables/may-match'
import { useLocationStore } from '@/stores/location'
import { useUiStore } from '@/stores/ui'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * Home (s2-home): categories, hints, «Может подойти для обмена», «Вы
 * смотрели», new offers near the chosen place. Like the old home page, the
 * feed ignores catalog filters and sorting: newest first, by place only.
 */
const { t } = useI18n()
const location = useLocationStore()
const ui = useUiStore()
const soon = useSoon()
const locationLabel = useLocationLabel()
const areaPhrase = useAreaPhrase()
const matches = useMayMatch()

/** The old home page asked for 15 when five cards fit in a row, else 12. */
const pageSize = ref(typeof window !== 'undefined' && window.innerWidth >= 1182 ? 15 : 12)
const list = useCatalogList(
  () => ({
    kind: 'feed',
    request: {
      location: [...location.feedLocation],
      orderBy: 'height',
      orderDesc: true,
      pageSize: pageSize.value,
    },
  }),
  null
)

const from = computed(() => (location.filtered ? (location.area?.center ?? null) : null))
const matchItems = computed(() => matches.data.value ?? [])

function openAll() {
  if (window.matchMedia('(max-width: 767px)').matches) ui.openCategories()
  else ui.mega = true
}
</script>

<template>
  <AppLayout tab="search">
    <template #mobile-top>
      <div class="home-top">
        <div class="home-top__row">
          <button type="button" class="home-top__place" @click="ui.openLocation()">
            <UiIcon name="location" :size="16" :stroke="2" />{{ locationLabel }}
            <UiIcon name="chevron" :size="14" :stroke="2.4" />
          </button>
          <button
            type="button"
            class="home-top__bell"
            :aria-label="t('home.notifications')"
            @click="soon"
          >
            <UiIcon name="bell" :size="24" />
          </button>
        </div>
        <button
          type="button"
          class="home-top__search"
          data-testid="mobile-search"
          @click="ui.openSearch()"
        >
          <UiIcon name="search" :size="20" />{{ t('header.searchPlaceholder') }}
        </button>
      </div>
    </template>

    <div class="container home" data-testid="home">
      <CategoryTiles @all="openAll" />
      <HomeBanners @action="soon" />

      <section v-if="matchItems.length" class="home__section" data-testid="may-match">
        <div class="home__head">
          <div>
            <h2 class="home__title">{{ t('home.mayMatch') }}</h2>
            <p class="home__sub">{{ t('home.mayMatchSub') }}</p>
          </div>
        </div>
        <HomeCarousel arrows :label="t('home.mayMatch')">
          <MatchCard v-for="item in matchItems" :key="item.target.hash ?? ''" :item="item" />
        </HomeCarousel>
      </section>

      <ViewedRow />

      <section class="home__section" data-testid="new-offers">
        <div class="home__head home__head--wrap">
          <h2 class="home__title">{{ t('home.newOffers') }}</h2>
          <button type="button" class="home__place" @click="ui.openLocation()">
            <UiIcon name="location" :size="16" :stroke="2" />
            <span>{{ areaPhrase ?? t('location.allRegions') }} ·</span>
            <span class="home__change">{{ t('location.change') }}</span>
          </button>
        </div>
        <RatesNotice />
        <OfferList
          :offers="list.offers.value"
          :columns="5"
          :loading="list.loading.value"
          :error="list.error.value"
          :more-error="list.moreError.value"
          :has-more="list.hasMore.value"
          :loading-more="list.loadingMore.value"
          :from="from"
          :skeletons="10"
          @more="list.more"
          @retry="list.retry"
        >
          <template #empty>
            <div class="home__empty">
              <p>{{ location.filtered ? t('home.emptyHere') : t('home.empty') }}</p>
              <button
                v-if="location.filtered"
                type="button"
                class="home__change"
                @click="location.reset(true)"
              >
                {{ t('location.allRegions') }}
              </button>
            </div>
          </template>
        </OfferList>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.home {
  padding-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.home__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.home__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px 24px;
  min-height: 40px;
}

.home__head--wrap {
  flex-wrap: wrap;
  align-items: baseline;
}

.home__title {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
}

.home__sub {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.home__place {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text2);
  font: 400 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 6px;
}

.home__change {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.home__place:focus-visible,
.home__change:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}

.home__empty {
  padding: 32px;
  border-radius: 20px;
  background: var(--surface);
  text-align: center;
  color: var(--text2);
}

.home-top {
  padding: 12px 16px 14px;
  border-radius: 0 0 20px 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.home-top__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home-top__place {
  min-height: 36px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: 600 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 4px;
}

.home-top__place .ui-icon:first-child {
  color: var(--link);
}

.home-top__place .ui-icon:last-child {
  color: var(--text3);
}

.home-top__bell {
  width: 44px;
  height: 44px;
  margin-right: -8px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-top__search {
  height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text3);
  font: 400 15px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.home-top__place:focus-visible,
.home-top__bell:focus-visible,
.home-top__search:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

@media (max-width: 767px) {
  .home {
    padding-top: 16px;
    padding-bottom: 24px;
    gap: 28px;
  }

  .home__title {
    font-size: 20px;
    line-height: 26px;
  }

  .home__sub {
    display: none;
  }
}
</style>
