<script setup lang="ts">
import { computed } from 'vue'
import { useAccount } from '@/api/queries'
import { offerCardData, type CardContext } from '@/components/offer/card-data'
import OfferCard from '@/components/offer/OfferCard.vue'
import type { Offer } from '@/models/offer'

/**
 * A card with the seller's profile: «my list» and the rating come from it.
 * Every card asks for its seller; the batcher sends one request for all.
 */
const props = defineProps<{
  offer: Offer
  context: Omit<CardContext, 'sellerList' | 'rating'>
  pending?: boolean
}>()

const seller = useAccount(() => props.offer.address)

const data = computed(() => {
  const account = seller.data.value
  return offerCardData(props.offer, {
    ...props.context,
    sellerList: account?.tags,
    rating: account?.ratingCount ? account.rating : undefined,
    pending: props.pending,
  })
})
</script>

<template>
  <OfferCard :offer="data" />
</template>
