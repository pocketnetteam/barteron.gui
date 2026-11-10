<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAccount } from '@/api/queries'
import { formatDistance } from '@/lib/area'
import { decodeGeohash, distanceKm, type LatLng } from '@/lib/geohash'
import type { Offer } from '@/models/offer'
import { useFavoritesStore } from '@/stores/favorites'
import { useTxStore } from '@/stores/tx'
import { offerCardData, type CardContext } from './card-data'
import OfferCard from './OfferCard.vue'
import OfferRow from './OfferRow.vue'

/**
 * An offer card from node data. The seller's profile gives «my list» and the
 * rating (one request for all cards on the page). Place on the card is the
 * distance from the search centre: asking Nominatim for every card would
 * break its limit of one request a second.
 */
const props = withDefaults(
  defineProps<{
    offer: Offer
    context: Omit<CardContext, 'sellerList' | 'rating' | 'favorite' | 'pending'>
    view?: 'tile' | 'row'
    /** Search centre for «1,8 км». */
    from?: LatLng | null
  }>(),
  { view: 'tile', from: null }
)

const { t, locale } = useI18n()
const favorites = useFavoritesStore()
const tx = useTxStore()
const seller = useAccount(() => props.offer.address)

const place = computed(() => {
  const point = props.from ? decodeGeohash(props.offer.geohash) : null
  if (!point || !props.from) return undefined
  return formatDistance(distanceKm(props.from, point), locale.value, {
    km: t('location.km'),
    m: t('location.m'),
  })
})

const data = computed(() => {
  const account = seller.data.value
  const card = offerCardData(props.offer, {
    ...props.context,
    sellerList: account?.tags,
    rating: account?.ratingCount ? account.rating : undefined,
    favorite: favorites.has(props.offer.hash),
    pending: !!props.offer.hash && tx.latestFor(props.offer.hash)?.status === 'waiting',
  })
  return {
    ...card,
    place: place.value,
    // Only «Б/У» is marked on the photo, as in the mockups.
    condition: card.condition === 'used' ? ('used' as const) : undefined,
  }
})

/** Like the old app, favourites work before sign-in too (kept without the address prefix). */
function toggleFavorite() {
  if (props.offer.hash) favorites.toggle(props.offer.hash)
}
</script>

<template>
  <OfferRow v-if="view === 'row'" :offer="data" @favorite="toggleFavorite" />
  <OfferCard v-else :offer="data" @favorite="toggleFavorite" />
</template>
