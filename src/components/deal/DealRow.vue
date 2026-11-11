<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import type { DealListItem } from '@/composables/safe-deal'
import { formatAgo, formatDate } from '@/lib/format'
import { dealQuery, paysNow, type DealRole, type DealStatus } from '@/models/safe-deal'
import UiBadge, { type BadgeTone } from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'

/** One deal in «Сделки» (s7-deals-desktop): my role, the status, who else, what now. */
const props = defineProps<{
  item: DealListItem
  names: ReadonlyMap<string, string>
}>()
const { t, locale } = useI18n()
const context = useCardContext()

const to = computed(() => ({ name: 'SafeDeal', query: dealQuery(props.item.deal) }))
const card = computed(() =>
  props.item.offer ? offerCardData(props.item.offer, context.value) : null
)
const status = computed<DealStatus | null>(() => props.item.state?.status ?? null)
const name = (address: string | undefined) =>
  (address && props.names.get(address)) || t('deal.someone')

const people = computed(() => {
  const { deal, offer, role } = props.item
  const seller = offer?.address
  if (role === 'buyer')
    return `${t('deals.people.seller', { name: name(seller) })} · ${t('deals.people.validatorNext', { name: name(deal.validator) })}`
  if (role === 'seller')
    return `${t('deals.people.buyer', { name: name(deal.buyer) })} · ${t('deals.people.validatorNext', { name: name(deal.validator) })}`
  return `${t('deals.people.buyer', { name: name(deal.buyer) })} · ${t('deals.people.sellerNext', { name: name(seller) })}`
})

const TONES: Record<DealStatus, BadgeTone> = {
  '1': 'neutral',
  '2': 'info',
  '3a': 'warning',
  '3b': 'warning',
  '4a': 'success',
  '4b': 'danger',
}

const when = computed(() => {
  const { state, sentAt, deal } = props.item
  const ago = (time: number) => formatAgo(time, locale.value)
  if (!state) return ''
  if (sentAt) return t('deals.when.sent', { ago: ago(sentAt) })
  const at = state.transfer?.time ?? 0
  switch (state.status) {
    case '1':
      return state.paying
        ? t('deals.when.paying', { ago: ago(state.paying.time) })
        : t('deals.when.created', { date: ago(deal.savedAt) })
    case '2':
      return t('deals.when.paid', { ago: ago(at) })
    case '3a':
    case '3b':
      return t('deals.when.transit', { ago: ago(at) })
    case '4a':
      return t('deals.when.done', { date: formatDate(at, locale.value) })
    case '4b':
      return t('deals.when.cancelled', { date: formatDate(at, locale.value) })
  }
  return ''
})

/** The one who sends money now gets a filled button (old turn), the rest — «Открыть». */
const mine = computed(
  () => !!status.value && !props.item.sentAt && paysNow(props.item.role, status.value)
)
const action = computed(() => {
  if (!mine.value) return t('deals.action.open')
  return props.item.role === 'buyer' ? t('deals.action.pay') : t('deals.action.decide')
})
const role = computed<DealRole | null>(() => props.item.role)
</script>

<template>
  <article
    class="drow"
    :class="{ 'drow--turn': mine }"
    data-testid="deal-row"
    :data-id="item.deal.id"
    :data-status="status ?? item.status"
  >
    <RouterLink :to="to" class="drow__photo" tabindex="-1" aria-hidden="true">
      <OfferPhoto :src="card?.photo ?? null" ratio="4 / 3" radius="10px" />
    </RouterLink>
    <div class="drow__body">
      <div class="drow__badges">
        <UiBadge v-if="role" tone="neutral">{{ t(`deals.youAre.${role}`) }}</UiBadge>
        <UiBadge v-if="status" :tone="TONES[status]"
          >{{ status }} · {{ t(`deal.status.s${status}`) }}</UiBadge
        >
        <UiBadge v-else-if="item.status === 'noOffer'" tone="danger">{{
          t('deals.noOffer')
        }}</UiBadge>
        <span v-else-if="item.status === 'error'" class="drow__muted">{{ t('deals.failed') }}</span>
        <span v-else class="drow__muted">{{ t('deals.loading') }}</span>
      </div>
      <RouterLink :to="to" class="drow__title">{{
        item.offer?.caption ?? item.deal.offer.slice(0, 12)
      }}</RouterLink>
      <span v-if="item.offer" class="drow__muted">{{ people }}</span>
    </div>
    <div class="drow__end">
      <div class="drow__price">
        <PriceTag v-if="card" :price="card.price" :size="16" no-equivalent />
        <span class="drow__muted">{{ when }}</span>
      </div>
      <UiButton
        :to="to"
        :variant="mine ? 'primary' : 'outline'"
        :size="40"
        data-testid="deal-row-open"
        >{{ action }}</UiButton
      >
    </div>
  </article>
</template>

<style scoped>
.drow {
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.drow + .drow {
  border-top: 1px solid var(--border);
}

.drow--turn {
  background: var(--primary-soft);
}

.drow__photo {
  width: 96px;
  flex: none;
}

.drow__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drow__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.drow__title {
  color: var(--text);
  font-weight: 600;
  font-size: 16px;
  line-height: 22px;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drow__muted {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.drow__end {
  display: flex;
  align-items: center;
  gap: 16px;
}

.drow__price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  text-align: right;
}

@media (max-width: 767px) {
  .drow {
    padding: 14px 16px;
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    align-items: start;
    gap: 10px 12px;
  }

  .drow__photo {
    width: 72px;
  }

  .drow__title {
    white-space: normal;
  }

  .drow__end {
    grid-column: 1 / -1;
    justify-content: space-between;
  }

  .drow__price {
    align-items: flex-start;
    text-align: left;
  }
}
</style>
