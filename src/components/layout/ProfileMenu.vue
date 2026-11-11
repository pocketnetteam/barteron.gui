<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBastyonProfile } from '@/composables/bastyon'
import { useBalance, useOffersByAddress, useRates, useUserProfile } from '@/api/queries'
import { toEquivalent } from '@/api/rates'
import { formatMoney, formatPkoin } from '@/lib/format'
import { isOfferActive } from '@/models/offer'
import { useSoon } from '@/composables/catalog-nav'
import { useCurrencyStore } from '@/stores/currency'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionStore } from '@/stores/session'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiIcon from '@/ui/UiIcon.vue'
import MenuList, { type MenuItem } from './MenuList.vue'

/**
 * Profile menu (s2-nav-desktop): the cabinet sections (`composables/cabinet`). The old
 * profile tabs keep their hashes: `#ads`, `#barters`, `#favorites`, `#votes`.
 */
const emit = defineEmits<{ close: [] }>()
const { t, locale } = useI18n()
const session = useSessionStore()
const me = computed(() => session.address)
const profile = useUserProfile(me)
const offers = useOffersByAddress(me)
const balance = useBalance()
const rates = useRates()
const currency = useCurrencyStore()
const favorites = useFavoritesStore()
const soon = useSoon()
const openBastyon = useBastyonProfile()

const name = computed(() => profile.data.value?.name || t('header.you'))
const avatar = computed(() => {
  const image = profile.data.value?.image
  return image ? (session.sdk?.manageBastyonImageSrc(image) ?? image) : null
})
const pkoin = computed(() =>
  balance.data.value === null || balance.data.value === undefined
    ? null
    : `${formatPkoin(balance.data.value, locale.value)} PKOIN`
)
const equivalent = computed(() => {
  const code = currency.shown
  if (!code || balance.data.value === null || balance.data.value === undefined) return null
  const money = toEquivalent(Math.round(balance.data.value * 100), code, rates.data.value)
  return money ? `≈ ${formatMoney(money.amount, money.currency, locale.value)}` : null
})

const profileRoute = (hash = '') => ({
  name: 'profile',
  params: { id: me.value ?? '' },
  hash,
})

const items = computed<MenuItem[]>(() => [
  {
    key: 'ads',
    label: t('profileMenu.offers'),
    meta: offers.data.value?.filter((o) => isOfferActive(o)).length ?? null,
    to: profileRoute('#ads'),
  },
  { key: 'barters', label: t('profileMenu.exchanges'), to: profileRoute('#barters') },
  { key: 'deals', label: t('profileMenu.deals'), to: profileRoute('#deals') },
  {
    key: 'favorites',
    label: t('profileMenu.favorites'),
    meta: favorites.ids.length || null,
    to: profileRoute('#favorites'),
  },
  { key: 'viewed', label: t('profileMenu.viewed'), to: profileRoute('#viewed') },
  { key: 'votes', label: t('profileMenu.reviews'), to: profileRoute('#votes') },
  {
    key: 'notifications',
    label: t('profileMenu.notifications'),
    to: profileRoute('#notifications'),
  },
  { key: 'settings', label: t('profileMenu.settings'), to: profileRoute('#settings') },
  { key: 'bastyon', label: t('profileMenu.bastyonProfile'), external: true, divider: true },
  { key: 'referral', label: t('header.referral'), to: profileRoute('#wallet') },
])

function select(key: string) {
  const item = items.value.find((i) => i.key === key)
  emit('close')
  if (item?.to) return
  if (key === 'bastyon' && me.value) {
    void openBastyon(me.value, profile.data.value?.name)
    return
  }
  soon()
}
</script>

<template>
  <div class="pm" data-testid="profile-menu">
    <div class="pm__head">
      <UiAvatar :name="name" :seed="me ?? undefined" :src="avatar" :size="48" />
      <div class="pm__who">
        <span class="pm__name">{{ name }}</span>
        <RouterLink class="pm__link" :to="profileRoute()" @click="emit('close')">
          {{ t('profileMenu.myProfile') }}
        </RouterLink>
      </div>
    </div>
    <RouterLink class="pm__wallet" :to="profileRoute('#wallet')" @click="emit('close')">
      <UiIcon class="pm__pkoin" name="pkoin" :size="22" :stroke="2" />
      <span class="pm__sum">
        <span class="pm__amount">{{ pkoin ?? t('profileMenu.balanceUnknown') }}</span>
        <span class="pm__sub">{{
          [equivalent, t('profileMenu.wallet')].filter(Boolean).join(' · ')
        }}</span>
      </span>
      <UiIcon name="chevron-right" :size="16" :stroke="2" />
    </RouterLink>
    <MenuList class="pm__list" :items="items" @select="select" />
  </div>
</template>

<style scoped>
.pm {
  padding: 8px 0 0;
}

.pm__head {
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pm__who {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pm__name {
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pm__link {
  font-size: 13px;
  line-height: 18px;
  color: var(--link);
}

.pm__wallet {
  margin: 4px 12px 0;
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--pkoin-soft);
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.pm__wallet:hover {
  text-decoration: none;
  filter: brightness(0.98);
}

.pm__wallet:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.pm__pkoin {
  color: var(--pkoin);
}

.pm__sum {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pm__amount {
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.pm__sub {
  font-size: 12px;
  line-height: 16px;
  color: var(--text2);
}

.pm__list {
  padding-top: 8px;
}
</style>
