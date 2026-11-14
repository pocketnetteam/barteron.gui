<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAccount, useCategories, useOffersByAddress, useUserProfile } from '@/api/queries'
import ReviewList from '@/components/cabinet/ReviewList.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import MenuList, { type MenuItem } from '@/components/layout/MenuList.vue'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import OfferTile from '@/components/offer/OfferTile.vue'
import { useCardContext } from '@/components/offer/card-context'
import { useBastyonProfile } from '@/composables/bastyon'
import { cabinetRoute } from '@/composables/cabinet'
import { useChat } from '@/composables/chat'
import { usePhone } from '@/composables/media'
import { useCityName } from '@/composables/place-name'
import { useProfileReviews } from '@/composables/profile-reviews'
import { DEFAULT_GUARANTOR_FEE_PERCENT, isGuarantor, isModerator } from '@/config/roles'
import { formatMonthYear } from '@/lib/format'
import { guarantorState } from '@/models/account'
import { PKOIN_CATEGORY } from '@/models/draft'
import { isOfferActive } from '@/models/offer'
import { useSessionStore } from '@/stores/session'
import { showToast } from '@/ui/toast'
import UiAlert from '@/ui/UiAlert.vue'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiBadge from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiPopover from '@/ui/UiPopover.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiTabs from '@/ui/UiTabs.vue'

/**
 * A seller's public profile (s5-profile-desktop / -mobile, s5-states «Чужой
 * профиль»): rating, roles, their exchange list, active offers and reviews.
 * Tabs keep the old hashes: `#ads`, `#votes`. `self` — my own, as others see it.
 */
const props = defineProps<{ address: string; self?: boolean }>()
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const phone = usePhone()
const context = useCardContext()
const categories = useCategories()
const chat = useChat()
const openBastyon = useBastyonProfile()

const address = computed(() => props.address)
const account = useAccount(address)
const profile = useUserProfile(address)
const offers = useOffersByAddress(address)
const reviews = useProfileReviews(address)
const city = useCityName(() => account.data.value?.geohash)

const name = computed(() => profile.data.value?.name || address.value.slice(0, 10))
const avatar = computed(() => {
  const image = profile.data.value?.image
  return image ? (session.sdk?.manageBastyonImageSrc(image) ?? image) : null
})
const notFound = computed(
  () =>
    profile.isSuccess.value &&
    !profile.data.value &&
    account.isSuccess.value &&
    !account.data.value?.hash &&
    offers.isSuccess.value &&
    !offers.data.value?.length
)
const loading = computed(() => profile.isPending.value || account.isPending.value)
/**
 * The node did not give something: said so, not passed off as «нет объявлений»
 * or «нет оценок».
 */
const failed = computed(
  () => profile.isError.value || account.isError.value || offers.isError.value
)
function retry() {
  for (const q of [profile, account, offers]) if (q.isError.value) void q.refetch()
  if (reviews.error.value) reviews.refetch()
}

const guarantor = computed(() =>
  isGuarantor(address.value) && account.data.value
    ? guarantorState(account.data.value, DEFAULT_GUARANTOR_FEE_PERCENT)
    : null
)
const moderator = computed(() => isModerator(address.value))
const role = computed(() =>
  guarantor.value ? 'guarantor' : moderator.value ? 'moderator' : undefined
)

const ratingValue = computed(() =>
  (account.data.value?.rating ?? 0).toLocaleString(locale.value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
)
const scores = computed(() => account.data.value?.ratingCount ?? 0)
const since = computed(() => {
  const time = account.data.value?.regdate ?? profile.data.value?.regdate
  return time ? formatMonthYear(time, locale.value) : null
})

const active = computed(() =>
  (offers.data.value ?? []).filter((o) => isOfferActive(o)).sort((a, b) => b.time - a.time)
)
const wants = computed(() =>
  (account.data.value?.tags ?? []).map((id) => ({ id, label: categories.label(id) ?? `#${id}` }))
)

// ─── Tabs: old hashes ───────────────────────────────────────────────────────
type Tab = 'ads' | 'votes'
const tab = computed<Tab>({
  get: () => (route.hash === '#votes' ? 'votes' : 'ads'),
  set: (value) => void router.replace({ ...route, hash: props.self ? '#public' : `#${value}` }),
})
const localTab = ref<Tab | null>(null)
const currentTab = computed<Tab>({
  get: () => localTab.value ?? tab.value,
  set: (value) => {
    localTab.value = value
    if (!props.self) tab.value = value
  },
})
const tabs = computed(() => [
  { value: 'ads' as Tab, label: t('profile.tabs.offers'), count: active.value.length },
  { value: 'votes' as Tab, label: t('profile.tabs.reviews'), count: reviews.rows.value.length },
])
const latest = computed(() => reviews.rows.value.slice(0, 3))

// ─── Actions ────────────────────────────────────────────────────────────────
function write() {
  void chat.open({ members: [address.value], messages: [] })
}

const moreBtn = ref<HTMLElement | null>(null)
const moreOpen = ref(false)
function toggleMore(event: Event) {
  moreBtn.value = event.currentTarget as HTMLElement
  moreOpen.value = !moreOpen.value
}
const menu = computed<MenuItem[]>(() => [
  { key: 'share', label: t('profile.share') },
  { key: 'copy', label: t('profile.copyAddress') },
  ...(props.self ? [] : [{ key: 'complain', label: t('profile.complain'), divider: true }]),
])

async function share() {
  const sdk = session.sdk
  if (!sdk) return
  const data = {
    path: `profile/${address.value}`,
    sharing: { title: '', text: { body: name.value }, images: avatar.value ? [avatar.value] : [] },
  }
  try {
    if (sdk.helpers.shareOnBastyon) sdk.helpers.shareOnBastyon(data)
    else await sdk.helpers.share(data)
  } catch {
    showToast(t('item.shareFailed'), { kind: 'error' })
  }
}

/** The host's complaint form, as for an offer, but about the user. */
function complain() {
  const sdk = session.sdk
  if (!sdk) return
  let search = ''
  try {
    search = new URL(sdk.get.applink(`profile/${address.value}`)).search
  } catch {
    // A relative link: no query to pass.
  }
  void sdk.helpers
    .complain({
      entityLink: `/application${search}`,
      entityTxid: account.data.value?.hash ?? address.value,
      entityType: 'user',
    })
    .catch(() => null)
}

async function onMenu(key: string) {
  moreOpen.value = false
  if (key === 'share') await share()
  else if (key === 'complain') complain()
  else if (key === 'copy') {
    try {
      await navigator.clipboard.writeText(address.value)
      showToast(t('profile.addressCopied'))
    } catch {
      showToast(t('profile.copyFailed'), { kind: 'error' })
    }
  }
}
</script>

<template>
  <AppLayout :tab="self ? 'profile' : undefined">
    <template #mobile-top>
      <PageTopBar :back="self ? cabinetRoute(address) : { name: 'home' }">
        <UiButton
          variant="ghost"
          :size="44"
          icon="more"
          :label="t('profile.more')"
          @click="toggleMore"
        />
      </PageTopBar>
    </template>

    <div class="pp container" data-testid="profile" :data-self="self || undefined">
      <UiAlert v-if="self" tone="info" class="pp__self" data-testid="profile-self">
        {{ t('profile.self.text') }}
        <template #action>
          <UiButton variant="secondary" :size="36" :to="cabinetRoute(address)">{{
            t('profile.self.back')
          }}</UiButton>
        </template>
      </UiAlert>

      <UiAlert v-if="failed" tone="danger" live data-testid="profile-failed">
        {{ t('profile.failed') }}
        <template #action>
          <UiButton variant="neutral" :size="36" icon="retry" @click="retry">{{
            t('item.missing.refresh')
          }}</UiButton>
        </template>
      </UiAlert>

      <UiEmptyState
        v-if="notFound"
        icon="user"
        :title="t('profile.notFound.title')"
        :text="t('profile.notFound.text')"
        data-testid="profile-missing"
      >
        <UiButton variant="neutral" :to="{ name: 'home' }">{{ t('saved.toOffers') }}</UiButton>
      </UiEmptyState>

      <template v-else>
        <section class="pp__head">
          <UiAvatar
            class="pp__avatar"
            :name="name"
            :seed="address"
            :src="avatar"
            :size="96"
            :role="role"
          />
          <div class="pp__who">
            <UiSkeleton v-if="loading" width="240px" height="32px" radius="8px" />
            <h1 v-else class="pp__name" data-testid="profile-name">{{ name }}</h1>
            <div class="pp__meta">
              <button v-if="scores" type="button" class="pp__rating" @click="currentTab = 'votes'">
                <b>{{ ratingValue }}</b>
                <UiIcon name="star-filled" :size="15" class="pp__star" />
                <span>{{ t('profile.scores', scores) }}</span>
              </button>
              <span v-else-if="account.isSuccess.value">{{ t('profile.noScores') }}</span>
              <span v-if="since">{{
                phone
                  ? t('profile.sinceShort', { date: since })
                  : t('profile.since', { date: since })
              }}</span>
              <span v-if="city.data.value && !phone">{{ city.data.value }}</span>
            </div>
            <div v-if="guarantor || moderator" class="pp__roles">
              <UiBadge
                v-if="guarantor"
                tone="success"
                icon="shield"
                pill
                data-testid="profile-guarantor"
                >{{
                  phone
                    ? t('profile.guarantorChipShort', { fee: guarantor.feePercent })
                    : t('profile.guarantorChip', {
                        fee: guarantor.feePercent,
                        status: guarantor.available
                          ? t('profile.available')
                          : t('profile.unavailable'),
                      })
                }}</UiBadge
              >
              <UiBadge v-if="moderator" tone="info" pill data-testid="profile-moderator">{{
                phone ? t('profile.moderatorChipShort') : t('profile.moderatorChip')
              }}</UiBadge>
            </div>
          </div>
          <div class="pp__actions">
            <UiButton
              v-if="!self"
              :size="48"
              external
              :loading="chat.opening.value"
              data-testid="profile-write"
              @click="write"
              >{{ t('profile.message') }}</UiButton
            >
            <UiButton
              variant="neutral"
              :size="48"
              external
              @click="openBastyon(address, profile.data.value?.name)"
              >{{ phone ? t('profile.bastyonShort') : t('profile.bastyon') }}</UiButton
            >
            <UiButton
              v-if="!phone"
              variant="neutral"
              :size="48"
              icon="more"
              :label="t('profile.more')"
              data-testid="profile-more"
              @click="toggleMore"
            />
          </div>
        </section>

        <div class="pp__grid">
          <div class="pp__main">
            <section v-if="phone" class="pp__card pp__wants">
              <span class="pp__card-title">{{ t('profile.exchange.title') }}</span>
              <div v-if="wants.length" class="pp__chips">
                <RouterLink
                  v-for="w in wants"
                  :key="w.id"
                  class="pp__chip"
                  :class="{ 'pp__chip--pkoin': w.id === PKOIN_CATEGORY }"
                  :to="{ name: 'category', params: { id: String(w.id) } }"
                  >{{ w.label }}</RouterLink
                >
              </div>
              <span v-else-if="account.isSuccess.value" class="pp__muted">{{
                t('profile.exchange.empty')
              }}</span>
            </section>

            <UiTabs v-model="currentTab" :items="tabs" :label="t('profile.title')" />

            <template v-if="currentTab === 'ads'">
              <div v-if="offers.isPending.value" class="pp__offers">
                <UiSkeleton v-for="i in 4" :key="i" ratio="3 / 4" radius="16px" />
              </div>
              <p
                v-else-if="offers.isError.value"
                class="pp__none"
                data-testid="profile-offers-failed"
              >
                {{ t('profile.offersFailed') }}
              </p>
              <p v-else-if="!active.length" class="pp__none" data-testid="profile-no-offers">
                {{ t('profile.noOffers') }}
              </p>
              <div v-else class="pp__offers" data-testid="profile-offers">
                <OfferTile
                  v-for="offer in active"
                  :key="offer.hash!"
                  :offer="offer"
                  :context="context"
                />
              </div>

              <section v-if="latest.length && !phone" class="pp__card pp__latest">
                <div class="pp__latest-head">
                  <h2 class="pp__h2">{{ t('profile.latestReviews') }}</h2>
                  <button type="button" class="pp__all" @click="currentTab = 'votes'">
                    {{ t('profile.allReviews', { n: reviews.rows.value.length }) }}
                  </button>
                </div>
                <ReviewList :rows="latest" />
              </section>
            </template>

            <template v-else>
              <div v-if="reviews.loading.value" class="pp__card">
                <UiSkeleton v-for="i in 3" :key="i" height="56px" radius="12px" />
              </div>
              <p v-else-if="reviews.error.value" class="pp__none">
                {{ t('profile.reviewsFailed') }}
              </p>
              <p v-else-if="!reviews.rows.value.length" class="pp__none">
                {{ t('profile.noReviews') }}
              </p>
              <div v-else class="pp__card" data-testid="profile-reviews">
                <ReviewList :rows="reviews.rows.value" avatars />
              </div>
            </template>
          </div>

          <aside v-if="!phone" class="pp__aside">
            <section class="pp__card pp__wants">
              <span class="pp__card-title">{{ t('profile.exchange.title') }}</span>
              <div
                v-if="wants.length"
                class="pp__chips pp__chips--column"
                data-testid="profile-wants"
              >
                <RouterLink
                  v-for="w in wants"
                  :key="w.id"
                  class="pp__chip"
                  :class="{ 'pp__chip--pkoin': w.id === PKOIN_CATEGORY }"
                  :to="{ name: 'category', params: { id: String(w.id) } }"
                  >{{ w.label }}</RouterLink
                >
              </div>
              <span class="pp__muted">{{
                wants.length
                  ? t('profile.exchange.note')
                  : account.isSuccess.value
                    ? t('profile.exchange.empty')
                    : ''
              }}</span>
            </section>
            <section v-if="guarantor" class="pp__card">
              <span class="pp__card-title">{{ t('profile.guarantor.title') }}</span>
              <p class="pp__text">
                {{ t('profile.guarantor.text', { name, fee: guarantor.feePercent }) }}
              </p>
              <UiBadge class="pp__status" :tone="guarantor.available ? 'success' : 'neutral'" dot>{{
                guarantor.available
                  ? t('profile.guarantor.available')
                  : t('profile.guarantor.unavailable')
              }}</UiBadge>
            </section>
            <button v-if="!self" type="button" class="pp__complain" @click="complain">
              <UiIcon name="complain" :size="16" />{{ t('profile.complain') }}
            </button>
          </aside>
        </div>
      </template>
    </div>

    <UiPopover
      v-model:open="moreOpen"
      :anchor="moreBtn"
      align="end"
      :width="260"
      :label="t('profile.more')"
    >
      <MenuList :items="menu" @select="onMenu" />
    </UiPopover>
  </AppLayout>
</template>

<style scoped>
.pp {
  padding-top: 24px;
  padding-bottom: 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pp__head {
  padding: 28px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 24px;
}

.pp__who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pp__name {
  margin: 0;
  font-size: 30px;
  line-height: 36px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.pp__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  font-size: 15px;
  line-height: 20px;
  color: var(--text2);
}

.pp__rating {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.pp__rating span {
  color: var(--link);
}

.pp__star {
  color: #f5a623;
}

.pp__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pp__actions {
  display: flex;
  gap: 8px;
}

.pp__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: start;
}

.pp__main,
.pp__aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pp__offers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px 16px;
}

.pp__card {
  padding: 20px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pp__card-title {
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
}

.pp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pp__chips--column {
  flex-direction: column;
  align-items: flex-start;
}

.pp__chip {
  padding: 6px 12px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--link);
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  text-decoration: none;
}

.pp__chip--pkoin {
  background: var(--pkoin-soft);
  color: var(--pkoin);
}

.pp__status {
  align-self: flex-start;
}

.pp__muted {
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.pp__text {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
  overflow-wrap: anywhere;
}

.pp__none {
  margin: 0;
  padding: 24px 16px;
  border-radius: var(--radius-l);
  background: var(--subtle);
  color: var(--text2);
  font-size: 15px;
  text-align: center;
}

.pp__latest {
  padding: 24px;
}

.pp__latest-head {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pp__h2 {
  margin: 0;
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
}

.pp__all {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
  cursor: pointer;
}

.pp__complain {
  padding: 4px 0;
  border: 0;
  background: none;
  color: var(--text2);
  font: 400 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.pp__complain:hover {
  color: var(--danger);
}

.pp__rating:focus-visible,
.pp__all:focus-visible,
.pp__complain:focus-visible,
.pp__chip:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
  border-radius: 6px;
}

@media (max-width: 1023px) {
  .pp__grid {
    grid-template-columns: minmax(0, 1fr) 240px;
  }
}

@media (max-width: 767px) {
  .pp {
    padding-top: 0;
    padding-bottom: 24px;
    gap: 12px;
  }

  .pp__head {
    margin: 0 calc(-1 * var(--page-pad));
    padding: 8px 16px 20px;
    border-radius: 0 0 20px 20px;
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .pp__who {
    align-items: center;
  }

  .pp__name {
    font-size: 24px;
    line-height: 30px;
  }

  .pp__meta {
    justify-content: center;
    font-size: 14px;
    gap: 4px 8px;
  }

  .pp__meta > * + *::before {
    content: '·';
    margin-right: 8px;
    color: var(--text3);
  }

  .pp__roles {
    justify-content: center;
  }

  .pp__actions {
    align-self: stretch;
  }

  .pp__actions > :deep(*) {
    flex: 1 1 0;
  }

  .pp__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .pp__offers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 12px;
  }

  .pp__self {
    margin-top: 12px;
  }
}
</style>
