<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories } from '@/api/queries'
import { cabinetRoute } from '@/composables/cabinet'
import type { OfferMatchState } from '@/composables/exchanges'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import { exchangeCategories } from '@/models/offer'
import { useSessionStore } from '@/stores/session'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import ExchangeTile from './ExchangeTile.vue'
import {
  distanceBetween,
  editListRoute,
  exchangeItems,
  offerRoute,
  optionsRoute,
} from './exchange-ui'

/**
 * One of my offers in the exchanges section (s6-hub): what it is wanted for
 * and the first exchanges found. A row of small cards on a phone.
 */
const props = defineProps<{
  state: OfferMatchState
  /** My profile list, for «my list». */
  myList: readonly number[]
  phone?: boolean
}>()
defineEmits<{ retry: [] }>()

const { t, locale } = useI18n()
const session = useSessionStore()
const categories = useCategories()

const offer = computed(() => props.state.offer)
const id = computed(() => offer.value.hash ?? '')
const photo = computed(() => {
  const src = offer.value.images[0]
  return src ? (session.sdk?.manageBastyonImageSrc(src) ?? src) : null
})
const wants = computed(() =>
  exchangeCategories(offer.value, props.myList)
    .map((c) => categories.label(c))
    .filter(Boolean)
    .join(', ')
)
const items = computed(() =>
  props.state.exchanges ? exchangeItems(props.state.exchanges).slice(0, props.phone ? 6 : 4) : []
)
const count = computed(() => props.state.count ?? 0)
const units = computed(() => ({ km: t('location.km'), m: t('location.m') }))
function meta(item: (typeof items.value)[number]) {
  if (item.chain) return t('exchanges.via', { title: item.chain.via.caption })
  return distanceBetween(offer.value, item.offer, locale.value, units.value)
}

/** Nothing to look for: why, and where to fix it. */
const noList = computed(() => {
  const reason = props.state.reason
  if (props.state.status !== 'none' || !reason) return null
  return {
    text: t(`exchanges.noList.${reason}`, { title: offer.value.caption }),
    action:
      reason === 'emptyMyList'
        ? { label: t('exchanges.noList.myList'), to: cabinetRoute(session.address, 'mylist') }
        : reason === 'notExchangeable'
          ? null
          : { label: t('exchanges.noList.action'), to: editListRoute(id.value) },
  }
})
</script>

<template>
  <article
    class="xo"
    :class="{ 'xo--phone': phone }"
    data-testid="exchange-offer"
    :data-id="id"
    :data-status="state.status"
  >
    <!-- Phone: the whole head opens the options (s6-hub-mobile). -->
    <RouterLink v-if="phone && !noList" class="xo__head xo__head--link" :to="optionsRoute(id)">
      <OfferPhoto class="xo__photo" :src="photo" ratio="4 / 3" radius="8px" />
      <span class="xo__text">
        <span class="xo__title">{{ offer.caption }}</span>
        <span v-if="state.status === 'ready'" :class="count ? 'xo__count' : 'xo__sub'">
          {{ count ? t('exchanges.variants', count) : t('exchanges.hub.offerNone') }}
        </span>
        <span v-else-if="state.status === 'error'" class="xo__sub">{{
          t('exchanges.hub.offerFailed')
        }}</span>
        <span v-else class="xo__sub">{{ t('exchanges.loading') }}</span>
      </span>
      <UiIcon name="chevron-right" :size="20" :stroke="2" class="xo__chevron" />
    </RouterLink>

    <div v-else class="xo__head">
      <OfferPhoto class="xo__photo" :src="photo" ratio="4 / 3" radius="10px" />
      <div class="xo__text">
        <RouterLink class="xo__title" :to="offerRoute(id)">{{ offer.caption }}</RouterLink>
        <span v-if="noList" class="xo__sub">{{ noList.text }}</span>
        <span v-else-if="state.status === 'ready' && !count" class="xo__sub">{{
          t('exchanges.hub.none')
        }}</span>
        <span v-else-if="wants" class="xo__sub">{{
          t('exchanges.hub.wants', { list: wants })
        }}</span>
      </div>
      <UiButton
        v-if="noList?.action"
        variant="secondary"
        :size="40"
        :to="noList.action.to"
        data-testid="exchange-offer-fix"
        >{{ noList.action.label }}</UiButton
      >
      <UiButton
        v-else-if="state.status === 'ready' && count"
        variant="secondary"
        :size="40"
        :to="optionsRoute(id)"
        data-testid="exchange-offer-all"
        >{{ t('exchanges.hub.all', { n: count }) }}</UiButton
      >
      <UiButton
        v-else-if="state.status === 'ready'"
        variant="neutral"
        :size="40"
        :to="editListRoute(id)"
        >{{ t('exchanges.editList') }}</UiButton
      >
    </div>

    <div v-if="state.status === 'pending'" class="xo__loading" :aria-label="t('exchanges.loading')">
      <UiSkeleton
        v-for="n in phone ? 2 : 4"
        :key="n"
        class="xo__skeleton"
        :width="phone ? '136px' : '100%'"
        ratio="4 / 3"
        radius="12px"
      />
    </div>
    <div v-else-if="state.status === 'error' && !phone" class="xo__error">
      <span>{{ t('exchanges.hub.offerFailed') }}</span>
      <UiButton variant="neutral" :size="36" @click="$emit('retry')">{{ t('ui.retry') }}</UiButton>
    </div>
    <div v-else-if="items.length" class="xo__items" :class="{ 'xo__items--row': phone }">
      <ExchangeTile
        v-for="item in items"
        :key="item.key"
        :offer="item.offer"
        :kind="item.kind"
        :to="item.to"
        :meta="phone ? null : meta(item)"
        :compact="phone"
      />
    </div>
  </article>
</template>

<style scoped>
.xo {
  padding: 18px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.xo__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}

.xo__photo {
  flex: none;
  width: 72px;
}

.xo__text {
  flex: 1 1 260px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.xo__title {
  font-size: 16px;
  line-height: 22px;
  font-weight: 600;
  color: var(--text);
}

a.xo__title:hover {
  color: var(--link);
}

.xo__sub {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.xo__count {
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: var(--link);
}

.xo__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(170px, 100%), 1fr));
  gap: 14px;
}

.xo__loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(170px, 100%), 1fr));
  gap: 14px;
}

.xo__error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  font-size: 14px;
  color: var(--text2);
}

/* ─── Phone ─────────────────────────────────────────────────────────────── */
.xo--phone {
  padding: 14px 0;
  gap: 12px;
}

.xo--phone .xo__head {
  padding: 0 14px;
  flex-wrap: nowrap;
  gap: 12px;
}

.xo__head--link {
  color: var(--text);
}

.xo--phone .xo__photo {
  width: 56px;
}

.xo--phone .xo__title {
  font-size: 15px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.xo__chevron {
  flex: none;
  color: var(--text3);
}

.xo__items--row {
  display: flex;
  gap: 10px;
  padding: 0 14px;
  overflow-x: auto;
  scrollbar-width: none;
}

.xo__items--row::-webkit-scrollbar {
  display: none;
}

.xo--phone .xo__loading {
  display: flex;
  gap: 10px;
  padding: 0 14px;
}

.xo--phone .xo__skeleton {
  flex: none;
}
</style>
