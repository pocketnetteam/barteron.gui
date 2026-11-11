<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import ReviewForm from '@/components/item/ReviewForm.vue'
import { useOfferReviews } from '@/composables/offer-reviews'
import type { Offer } from '@/models/offer'

/**
 * «Оцените покупку» right on the deal page once it is done (s7-dealstates
 * «4a · покупатель оценивает покупку»): the same form as on the offer page,
 * low scores through a moderator. Rated already — a thank-you and the way to
 * the reviews.
 */
const props = defineProps<{ offer: Offer }>()
const { t } = useI18n()
const reviews = useOfferReviews(toRef(props, 'offer'))
</script>

<template>
  <ReviewForm
    v-if="reviews.form.value === 'score'"
    :offer="offer"
    form="score"
    :title="t('deal.review.title')"
    :low-score-blocked="reviews.lowScoreBlocked.value"
    :sending="reviews.sending.value"
    data-testid="deal-review"
    @submit="reviews.submit"
  />
  <p v-else class="drv" data-testid="deal-reviewed">
    {{ t('deal.review.done') }}
    <RouterLink :to="{ name: 'barterItem', params: { id: offer.hash! }, hash: '#item-reviews' }">{{
      t('deal.review.toOffer')
    }}</RouterLink>
  </p>
</template>

<style scoped>
.drv {
  color: var(--text2);
  font-size: 14px;
  line-height: 20px;
}

.drv a {
  margin-left: 4px;
  color: var(--link);
  font-weight: 600;
}
</style>
