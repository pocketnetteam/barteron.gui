<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAccount, useCategories } from '@/api/queries'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import FavoriteButton from '@/components/offer/FavoriteButton.vue'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import { whyFits } from '@/models/exchange'
import { exchangeCategories, type Offer } from '@/models/offer'
import { useFavoritesStore } from '@/stores/favorites'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import { distanceBetween, offerRoute } from './exchange-ui'

/**
 * A direct exchange on «Варианты обмена» (s6-offer): their offer, why it
 * fits both lists, the seller and the distance, «Предложить обмен».
 */
const props = defineProps<{
  /** My offer. */
  source: Offer
  sourceWish: readonly number[]
  target: Offer
  seller?: string | null
  /** Only the owner of the source offer can propose. */
  canPropose?: boolean
  busy?: boolean
}>()
defineEmits<{ propose: [] }>()

const { t, locale } = useI18n()
const categories = useCategories()
const favorites = useFavoritesStore()
const context = useCardContext()
const owner = useAccount(() => props.target.address)

const card = computed(() =>
  offerCardData(props.target, { ...context.value, sellerList: owner.data.value?.tags })
)
const why = computed(() => {
  const tree = categories.tree.value
  if (!tree) return null
  const fit = whyFits(
    tree,
    props.source,
    props.sourceWish,
    props.target,
    exchangeCategories(props.target, owner.data.value?.tags ?? [])
  )
  const they = fit.theyWant !== null ? categories.label(fit.theyWant) : null
  const you = fit.youWant !== null ? categories.label(fit.youWant) : null
  if (they && you) return t('exchanges.offer.why', { they, you })
  return you ? t('exchanges.offer.whyYou', { you }) : null
})
const meta = computed(() =>
  [
    props.seller,
    distanceBetween(props.source, props.target, locale.value, {
      km: t('location.km'),
      m: t('location.m'),
    }),
  ]
    .filter(Boolean)
    .join(' · ')
)
const to = computed(() => offerRoute(props.target.hash ?? ''))
</script>

<template>
  <article class="dm" data-testid="direct-match" :data-id="target.hash">
    <RouterLink class="dm__photo" :to="to" tabindex="-1" aria-hidden="true">
      <OfferPhoto :src="card.photo" ratio="4 / 3" radius="12px" />
    </RouterLink>
    <div class="dm__body">
      <RouterLink class="dm__title" :to="to">{{ card.title }}</RouterLink>
      <PriceTag :price="card.price" :size="18" no-equivalent />
      <span v-if="meta" class="dm__meta">{{ meta }}</span>
    </div>
    <span v-if="why" class="dm__why">
      <UiIcon name="check" :size="14" :stroke="2.6" class="dm__check" />
      {{ why }}
    </span>
    <div class="dm__actions">
      <UiButton
        v-if="canPropose"
        class="dm__propose"
        :size="40"
        :disabled="busy"
        data-testid="direct-propose"
        @click="$emit('propose')"
        >{{ t('exchanges.offer.propose') }}</UiButton
      >
      <FavoriteButton
        class="dm__fav"
        variant="plain"
        :active="favorites.has(target.hash)"
        @toggle="target.hash && favorites.toggle(target.hash)"
      />
    </div>
  </article>
</template>

<style scoped>
.dm {
  padding: 12px;
  border-radius: 18px;
  background: var(--surface);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'photo' 'body' 'why' 'actions';
  gap: 10px;
}

.dm__photo {
  grid-area: photo;
  display: block;
}

.dm__body {
  grid-area: body;
  padding: 0 4px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dm__title {
  font-size: 15px;
  line-height: 20px;
  color: var(--link);
}

.dm__meta {
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

.dm__why {
  grid-area: why;
  padding: 0 4px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.dm__check {
  flex: none;
  margin-top: 2px;
  color: var(--success);
}

.dm__actions {
  grid-area: actions;
  margin-top: auto;
  display: flex;
  gap: 8px;
}

.dm__propose {
  flex: 1;
}

.dm__fav {
  width: 40px;
  height: 40px;
  margin-left: auto;
  border-radius: 10px;
  background: var(--muted);
}

@media (max-width: 767px) {
  .dm {
    border-radius: 16px;
    grid-template-columns: 104px minmax(0, 1fr);
    grid-template-areas: 'photo body' 'why why' 'actions actions';
    column-gap: 12px;
  }

  .dm__body {
    padding: 0;
  }

  .dm__why {
    padding: 0;
  }

  .dm__propose {
    min-height: 44px;
  }
}
</style>
