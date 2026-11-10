<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { useCategories, useOffersByAddress, useOffersByIds } from '@/api/queries'
import ItemAbout from '@/components/item/ItemAbout.vue'
import ItemBuyBox from '@/components/item/ItemBuyBox.vue'
import ItemDelivery, { type PickupCard } from '@/components/item/ItemDelivery.vue'
import ItemExchange from '@/components/item/ItemExchange.vue'
import ItemGallery from '@/components/item/ItemGallery.vue'
import ItemLocation from '@/components/item/ItemLocation.vue'
import ItemNotice from '@/components/item/ItemNotice.vue'
import ItemReviews from '@/components/item/ItemReviews.vue'
import ItemSection from '@/components/item/ItemSection.vue'
import type { MyOfferOption } from '@/components/item/ProposeExchangeDialog.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import FavoriteButton from '@/components/offer/FavoriteButton.vue'
import OfferTile from '@/components/offer/OfferTile.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import SellerCard from '@/components/user/SellerCard.vue'
import { useBastyonProfile } from '@/composables/bastyon'
import { categoryRoute, useSoon } from '@/composables/catalog-nav'
import { exchangeMessages, offerLink, purchaseMessages, useChat } from '@/composables/chat'
import { fittingOffers } from '@/composables/may-match'
import { useOfferPage } from '@/composables/offer-page'
import { useOfferReviews } from '@/composables/offer-reviews'
import { decodeGeohash } from '@/lib/geohash'
import {
  deliveryOptions,
  formatHours,
  hasDeliveryChoice,
  openState,
  pickupPointInfo,
  type DeliveryPick,
} from '@/models/delivery'
import {
  exchangeCategories,
  isOfferActive,
  isPickupPoint,
  offerLifecycle,
  type Offer,
} from '@/models/offer'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionStore } from '@/stores/session'
import UiBreadcrumbs from '@/ui/UiBreadcrumbs.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiRating from '@/ui/UiRating.vue'

const PhotoViewer = defineAsyncComponent(() => import('@/components/item/PhotoViewer.vue'))
const ProposeExchangeDialog = defineAsyncComponent(
  () => import('@/components/item/ProposeExchangeDialog.vue')
)
const BuyDialog = defineAsyncComponent(() => import('@/components/item/BuyDialog.vue'))
const PickupPickerScreen = defineAsyncComponent(
  () => import('@/components/item/PickupPickerScreen.vue')
)

/** Someone else's offer (s3-item-desktop / s3-item-mobile / s3-item-states). */
const props = defineProps<{
  offer: Offer
  /** The owner looks at it as buyers see it (`?view=buyer`). */
  preview?: boolean
  /** A draft from the form (`/barter/draft`): the way back to it. */
  draftBack?: RouteLocationRaw
}>()

const { t, locale } = useI18n()
const router = useRouter()
const session = useSessionStore()
const favorites = useFavoritesStore()
const categories = useCategories()
const chat = useChat()
const soon = useSoon()
const openBastyon = useBastyonProfile()
const cardCtx = useCardContext()

const offer = toRef(props, 'offer')
const page = useOfferPage(offer)
const id = page.id
const me = computed(() => session.address)

const lifecycle = computed(() => offerLifecycle(offer.value))
const inactive = computed(() => lifecycle.value === 'expired' || lifecycle.value === 'withdrawn')

// ─── Scores and reviews ─────────────────────────────────────────────────────
const reviews = useOfferReviews(offer)
const average = reviews.average
const reviewForm = computed(() => (props.preview || inactive.value ? 'none' : reviews.form.value))

// ─── Exchange ───────────────────────────────────────────────────────────────
const mine = useOffersByAddress(me)
const myActive = computed(() =>
  (mine.data.value ?? []).filter((o) => isOfferActive(o) && !isPickupPoint(o))
)
const fits = computed(() => {
  const tree = categories.tree.value
  return tree
    ? fittingOffers(offer.value, myActive.value, tree, page.seller.data.value?.tags ?? [])
    : []
})
const fitBanner = computed(() => {
  const first = fits.value[0]
  if (!first) return null
  return {
    title: first.caption,
    photo: first.images[0]
      ? (session.sdk?.manageBastyonImageSrc(first.images[0]) ?? first.images[0])
      : null,
    category: categories.label(first.tag) ?? '',
  }
})
const myOptions = computed<MyOfferOption[]>(() => {
  const fitting = new Set(fits.value.map((o) => o.hash))
  return myActive.value.map((o) => {
    const data = offerCardData(o, cardCtx.value)
    return {
      id: o.hash!,
      title: o.caption,
      photo: data.photo ?? null,
      price: data.price,
      fits: fitting.has(o.hash),
    }
  })
})
const proposeOpen = ref(false)

async function startExchange() {
  if (!(await session.ensureSignedIn())) return
  proposeOpen.value = true
}

async function propose(myId: string) {
  const sdk = session.sdk
  const source = myActive.value.find((o) => o.hash === myId)
  if (!sdk || !source) return
  const ok = await chat.open({
    name: source.caption,
    members: [offer.value.address],
    messages: exchangeMessages((p) => sdk.get.applink(p), myId, id.value, t),
  })
  if (ok) proposeOpen.value = false
}

// ─── Delivery and purchase ──────────────────────────────────────────────────
const delivery = computed(() => deliveryOptions(offer.value))
const pointIds = computed(() =>
  delivery.value.pickupPoints.enabled ? delivery.value.pickupPoints.ids : []
)
const pointsQuery = useOffersByIds(pointIds)
const points = computed(() =>
  (pointsQuery.data.value ?? []).filter((p) => isPickupPoint(p) && isOfferActive(p))
)
const pointCards = computed<PickupCard[]>(() =>
  points.value
    .map((p) => {
      const info = pickupPointInfo(p)
      const data = offerCardData(p, cardCtx.value)
      const priceText = data.price.free
        ? t('price.free')
        : data.price.pkoin !== null && data.price.pkoin !== undefined
          ? `${new Intl.NumberFormat(locale.value).format(data.price.pkoin)} PKOIN`
          : ''
      const state = openState(info.schedule)
      const open =
        state.kind === 'always'
          ? { text: t('item.delivery.allDay'), tone: 'success' as const }
          : state.kind === 'open'
            ? {
                text: t('item.delivery.openUntil', { time: state.until }),
                tone: 'success' as const,
              }
            : state.kind === 'closed' && state.opens
              ? {
                  text: state.opens.today
                    ? t('item.delivery.opensAt', { time: state.opens.time })
                    : t('item.delivery.closed'),
                  tone: 'muted' as const,
                }
              : null
      const days = info.schedule.days
      const hours = days.every((d) => d && 'allDay' in d)
        ? t('item.delivery.allDayShort')
        : days.every(
              (d) => d && !('allDay' in d) && formatHours(d) === formatHours(days[0] as never)
            )
          ? t('item.delivery.daily', { hours: formatHours(days[0] as never) })
          : ''
      return {
        id: p.hash!,
        title: p.caption,
        line: [info.address, hours].filter(Boolean).join(' · '),
        price: priceText,
        priceShort: data.price.pkoin
          ? new Intl.NumberFormat(locale.value).format(data.price.pkoin)
          : undefined,
        pkoin: data.price.pkoin ?? 0,
        at: decodeGeohash(p.geohash),
        open,
        to: { name: 'barterItem', params: { id: p.hash! } },
      }
    })
    .sort((a, b) => a.pkoin - b.pkoin)
)
const pick = ref<DeliveryPick | null>(null)
const pickHint = ref(false)
const pickerOpen = ref(false)
const buyOpen = ref(false)
const chosenPoint = computed(() =>
  pick.value?.way === 'pickupPoint'
    ? (pointCards.value.find((p) => p.id === (pick.value as { id: string }).id) ?? null)
    : null
)
const chosenLine = computed(() =>
  chosenPoint.value
    ? t('item.buy.chosen', { name: chosenPoint.value.title, price: chosenPoint.value.price })
    : null
)
/** Old `safeDealAvailableForOffer`, minus what stage 8 checks (host version, guarantor list). */
const safeDealPossible = computed(
  () =>
    exchangeCategories(offer.value, page.seller.data.value?.tags ?? []).includes(17) &&
    pick.value?.way !== 'pickupPoint'
)
const purchaseLines = computed(() => {
  const p = pick.value
  if (p?.way === 'selfPickup') return [t('chatMessage.selfPickup')]
  if (p?.way === 'directDelivery') return [t('chatMessage.directDelivery')]
  if (p?.way === 'pickupPoint')
    return [t('chatMessage.pickupPoint'), chosenPoint.value?.title ?? '']
  return []
})

async function startPurchase() {
  if (!(await session.ensureSignedIn())) return
  if (hasDeliveryChoice(delivery.value) && !pick.value) {
    pickHint.value = true
    await nextTick()
    document
      .getElementById('item-delivery')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  buyOpen.value = true
}

async function confirmPurchase() {
  const sdk = session.sdk
  if (!sdk) return
  const members = [offer.value.address]
  const point =
    pick.value?.way === 'pickupPoint'
      ? points.value.find((p) => p.hash === (pick.value as { id: string }).id)
      : null
  if (point && !members.includes(point.address)) members.push(point.address)
  const ok = await chat.open({
    name: offer.value.caption,
    members,
    messages: purchaseMessages((p) => sdk.get.applink(p), id.value, pick.value, t),
  })
  if (ok) buyOpen.value = false
}

function ask() {
  const sdk = session.sdk
  if (!sdk) return
  void chat.open({
    members: [offer.value.address],
    messages: [offerLink((p) => sdk.get.applink(p), id.value)],
  })
}

// ─── Seller ─────────────────────────────────────────────────────────────────
const sellerOffers = useOffersByAddress(() => offer.value.address)
const sellerActive = computed(() =>
  (sellerOffers.data.value ?? []).filter((o) => isOfferActive(o) && o.hash !== id.value)
)
const sellerRoute = computed(() => ({
  name: 'profile',
  params: { id: offer.value.address },
  hash: '#ads',
}))

// ─── Gallery ────────────────────────────────────────────────────────────────
const viewerOpen = ref(false)
const viewerIndex = ref(0)
function openViewer(index: number) {
  viewerIndex.value = index
  viewerOpen.value = true
}

function back() {
  if (window.history.state?.back) router.back()
  else void router.push({ name: 'home' })
}

const favorite = computed(() => favorites.has(id.value))
const exchangeTitle = computed(() =>
  page.card.value.price.free && !page.card.value.exchange?.length
    ? t('item.exchange.titleFree')
    : t('item.exchange.title')
)
</script>

<template>
  <AppLayout :scope="offer.tag">
    <div class="op container" data-testid="item-page" data-kind="other">
      <!-- Preview of my own offer, or why it cannot be bought -->
      <ItemNotice
        v-if="preview && draftBack"
        class="op__notice"
        tone="surface"
        icon="views"
        :text="t('item.draftPreview.text')"
        data-testid="draft-preview"
      >
        <template #end>
          <RouterLink :to="draftBack">{{ t('item.draftPreview.back') }}</RouterLink>
        </template>
      </ItemNotice>
      <ItemNotice
        v-else-if="preview"
        class="op__notice"
        tone="surface"
        icon="views"
        :text="t('item.preview.text')"
      >
        <template #end>
          <RouterLink :to="{ name: 'barterItem', params: { id } }">{{
            t('item.preview.back')
          }}</RouterLink>
        </template>
      </ItemNotice>
      <ItemNotice
        v-else-if="inactive"
        class="op__notice"
        icon="clock"
        :title="
          lifecycle === 'expired' ? t('item.state.expiredOther') : t('item.state.withdrawnOther')
        "
        data-testid="item-inactive"
      />

      <!-- Computer: crumbs, title, meta -->
      <div class="op__head">
        <UiBreadcrumbs :items="page.crumbs.value" />
        <div class="op__title-row">
          <h1 class="op__title" data-testid="item-title">{{ offer.caption }}</h1>
          <!-- A draft has no id yet: nothing to keep or share. -->
          <div v-if="id" class="op__head-actions">
            <UiButton
              variant="outline"
              :size="40"
              :icon="favorite ? 'heart-filled' : 'heart'"
              :aria-pressed="favorite"
              data-testid="item-favorite"
              @click="favorites.toggle(id)"
            >
              {{ favorite ? t('item.inFavorites') : t('offer.favoriteAdd') }}
            </UiButton>
            <UiButton variant="outline" :size="40" icon="share" @click="page.share()">
              {{ t('item.share') }}
            </UiButton>
          </div>
        </div>
        <p class="op__meta">
          <span v-if="average.count" class="op__rating">
            <UiIcon name="star-filled" :size="14" class="op__star" />
            <strong>{{ average.value.toFixed(1).replace('.', ',') }}</strong>
            <a href="#item-reviews">{{
              t('item.reviews.scores', { n: average.count }, average.count)
            }}</a>
          </span>
          <span>{{ t('item.published', { date: page.published.value }) }}</span>
          <span v-if="id" class="op__number">
            № <span class="mono">{{ page.number.value }}</span>
            <button
              type="button"
              class="op__copy"
              :aria-label="t('item.copyNumber')"
              @click="page.copyNumber()"
            >
              <UiIcon name="copy" :size="15" />
            </button>
          </span>
        </p>
      </div>

      <div class="op__grid">
        <div class="op__main">
          <div class="op__gallery">
            <ItemGallery
              :slides="page.slides.value"
              :title="offer.caption"
              :badge="offer.condition === 'used' ? t('offer.condition.used') : null"
              :inactive="inactive"
              @open="openViewer"
            >
              <template #overlay>
                <div class="op__overlay">
                  <button type="button" class="op__round" :aria-label="t('ui.back')" @click="back">
                    <UiIcon name="back" :size="22" :stroke="2" />
                  </button>
                  <span v-if="id" class="op__overlay-end">
                    <button
                      type="button"
                      class="op__round"
                      :aria-label="t('item.share')"
                      @click="page.share()"
                    >
                      <UiIcon name="share" :size="20" />
                    </button>
                    <FavoriteButton
                      class="op__fav"
                      :active="favorite"
                      variant="photo"
                      @toggle="favorites.toggle(id)"
                    />
                  </span>
                </div>
              </template>
            </ItemGallery>
          </div>

          <!-- Phone: price, title, meta under the photo -->
          <section class="op__phone-head">
            <PriceTag :price="page.card.value.price" :size="28" :muted="inactive" />
            <h1 class="op__phone-title">{{ offer.caption }}</h1>
            <p class="op__phone-meta">
              <template v-if="average.count">
                <UiRating :value="average.value" variant="compact" />
                · {{ t('item.reviews.scores', { n: average.count }, average.count) }} ·
              </template>
              {{ page.published.value }}
            </p>
            <p v-if="offer.safeDeal.validatorFeeVariant && !inactive" class="op__phone-safe">
              <UiIcon name="safe-deal" :size="18" />
              {{ t('item.buy.safeShort') }}
            </p>
          </section>

          <ItemExchange
            :title="exchangeTitle"
            :items="page.card.value.exchange ?? []"
            :anything="page.card.value.exchangeAnything"
            :free="page.card.value.price.free && !page.card.value.exchange?.length"
            :fit="inactive || preview ? null : fitBanner"
            @propose="startExchange"
          />

          <ItemAbout :facts="page.facts.value" :description="offer.description" />

          <ItemDelivery
            v-if="hasDeliveryChoice(delivery)"
            v-model="pick"
            :options="delivery"
            :points="pointCards"
            :points-loading="pointsQuery.isPending.value && pointIds.length > 0"
            :readonly="preview || inactive"
            :attention="pickHint && !pick"
            @phone-picker="pickerOpen = true"
            @update:model-value="pickHint = false"
          />

          <ItemLocation class="op__location" :geohash="offer.geohash" />

          <ItemSection v-if="offer.safeDeal.validatorFeeVariant" class="op__safe">
            <div class="op__safe-row">
              <span class="op__safe-icon"><UiIcon name="safe-deal" :size="22" /></span>
              <div>
                <h2 class="op__safe-title">{{ t('item.safe.title') }}</h2>
                <p class="op__safe-text">
                  {{
                    offer.safeDeal.validatorFeeVariant === 'seller'
                      ? t('item.safe.textSeller')
                      : t('item.safe.textHalf')
                  }}
                </p>
                <button type="button" class="op__link" @click="soon()">
                  {{ t('item.safe.how') }}
                </button>
              </div>
            </div>
          </ItemSection>

          <ItemReviews
            class="op__reviews"
            :average="average"
            :rows="reviews.rows.value"
            :form="reviewForm"
            :low-score-blocked="reviews.lowScoreBlocked.value"
            :sending="reviews.sending.value"
            @submit="reviews.submit"
          />

          <!-- Phone: seller and reviews are compact -->
          <section class="op__phone-seller">
            <SellerCard
              :name="page.sellerName.value"
              :seed="offer.address"
              :avatar="page.sellerAvatar.value"
              :rating="
                page.seller.data.value?.ratingCount ? page.seller.data.value.rating : undefined
              "
              :reviews="page.seller.data.value?.ratingCount"
              :since="page.sellerSince.value"
              :profile-to="sellerRoute"
              @open-bastyon="openBastyon(offer.address, page.profile.data.value?.name)"
            />
          </section>
          <ItemReviews
            class="op__phone-reviews"
            compact
            :average="average"
            :rows="reviews.rows.value"
            :form="reviewForm"
            :low-score-blocked="reviews.lowScoreBlocked.value"
            :sending="reviews.sending.value"
            @submit="reviews.submit"
          />
          <div class="op__phone-foot">
            <button
              v-if="page.canComplain.value && !preview"
              type="button"
              class="op__complain"
              @click="page.complain()"
            >
              <UiIcon name="complain" :size="16" />
              {{ t('item.complainShort') }}
            </button>
            <span v-if="id" class="mono">№ {{ page.number.value }}</span>
          </div>
        </div>

        <aside class="op__aside">
          <ItemBuyBox
            :price="page.card.value.price"
            :inactive="inactive"
            :preview="preview"
            :safe-deal-fee="offer.safeDeal.validatorFeeVariant"
            :chosen="chosenLine"
            :pick-hint="pickHint && !pick"
            :busy="chat.opening.value"
            :similar-label="page.categoryName.value"
            @exchange="startExchange"
            @buy="startPurchase"
            @ask="ask"
            @similar="router.push(categoryRoute(offer.tag))"
          />
          <div class="op__seller">
            <SellerCard
              :name="page.sellerName.value"
              :seed="offer.address"
              :avatar="page.sellerAvatar.value"
              :rating="
                page.seller.data.value?.ratingCount ? page.seller.data.value.rating : undefined
              "
              :reviews="page.seller.data.value?.ratingCount"
              :since="page.sellerSince.value"
              :profile-to="sellerRoute"
              @open-bastyon="openBastyon(offer.address, page.profile.data.value?.name)"
            />
          </div>
          <button
            v-if="page.canComplain.value && !preview"
            type="button"
            class="op__complain"
            data-testid="item-complain"
            @click="page.complain()"
          >
            <UiIcon name="complain" :size="16" />
            {{ t('item.complain') }}
          </button>
        </aside>
      </div>

      <section v-if="sellerActive.length" class="op__more">
        <div class="op__more-head">
          <h2>{{ t('item.sellerOffers') }}</h2>
          <RouterLink :to="sellerRoute">{{
            t('item.sellerOffersAll', { n: sellerActive.length })
          }}</RouterLink>
        </div>
        <div class="op__more-grid">
          <OfferTile
            v-for="o in sellerActive.slice(0, 4)"
            :key="o.hash!"
            :offer="o"
            :context="cardCtx"
          />
        </div>
      </section>
    </div>

    <template #phone-bar>
      <div class="op__bar">
        <template v-if="inactive || preview">
          <UiButton variant="neutral" :size="48" block external :disabled="preview" @click="ask">
            {{ t('item.buy.ask') }}
          </UiButton>
        </template>
        <template v-else>
          <UiButton
            class="op__bar-chat"
            variant="neutral"
            :size="48"
            icon="chat"
            :label="t('item.buy.ask')"
            :disabled="chat.opening.value"
            @click="ask"
          />
          <UiButton :size="48" block :disabled="chat.opening.value" @click="startExchange">
            {{ t('item.buy.exchangeShort') }}
          </UiButton>
          <UiButton
            variant="contrast"
            :size="48"
            block
            :disabled="chat.opening.value"
            @click="startPurchase"
          >
            {{ t('item.buy.buy') }}
          </UiButton>
        </template>
      </div>
    </template>
  </AppLayout>

  <PhotoViewer
    v-if="viewerOpen"
    v-model:open="viewerOpen"
    v-model:index="viewerIndex"
    :slides="page.slides.value"
    :title="offer.caption"
    @retry-video="page.retryVideo()"
  />
  <ProposeExchangeDialog
    v-if="proposeOpen"
    v-model:open="proposeOpen"
    :target="offer.caption"
    :seller="page.sellerName.value"
    :options="myOptions"
    :loading="mine.isPending.value"
    :sending="chat.opening.value"
    @propose="propose"
  />
  <BuyDialog
    v-if="buyOpen"
    v-model:open="buyOpen"
    :title="offer.caption"
    :price="page.card.value.price"
    :photo="page.card.value.photo ?? null"
    :lines="purchaseLines"
    :safe-deal-possible="safeDealPossible"
    :sending="chat.opening.value"
    @confirm="confirmPurchase"
  />
  <PickupPickerScreen
    v-if="pickerOpen"
    v-model:open="pickerOpen"
    :points="pointCards"
    :selected="chosenPoint?.id ?? null"
    @pick="pick = { way: 'pickupPoint', id: $event }"
  />
</template>

<style scoped>
.op {
  padding-top: 20px;
  padding-bottom: 48px;
}

.op__notice {
  margin-bottom: 16px;
}

.op__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.op__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.op__title {
  font-size: 32px;
  line-height: 38px;
  font-weight: 800;
  letter-spacing: -0.4px;
  overflow-wrap: anywhere;
}

.op__head-actions {
  flex: none;
  display: flex;
  gap: 8px;
}

.op__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  color: var(--text2);
  font-size: 14px;
}

.op__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.op__star {
  color: var(--star);
}

.op__rating strong {
  color: var(--text);
}

.op__number {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.op__copy {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-s);
  background: none;
  color: var(--text3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.op__copy:hover {
  color: var(--text);
}

.op__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.op__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.op__gallery {
  padding: 16px;
  border-radius: var(--radius-xl);
  background: var(--surface);
}

.op__aside {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.op__complain {
  align-self: flex-start;
  padding: 4px 8px;
  border: 0;
  background: none;
  color: var(--text2);
  font: 500 14px / 20px var(--font-sans);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.op__complain:hover {
  color: var(--text);
}

.op__safe-row {
  display: flex;
  gap: 16px;
}

.op__safe-icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-m);
  background: var(--success-soft);
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
}

.op__safe-title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.op__safe-text {
  margin: 6px 0;
  max-width: 680px;
  color: var(--text2);
  font-size: 15px;
  line-height: 22px;
}

.op__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.op__more {
  margin-top: 32px;
  max-width: calc(100% - 364px);
}

.op__more-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.op__more-head h2 {
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
}

.op__more-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

/* Phone-only parts */
.op__phone-head,
.op__phone-seller,
.op__phone-reviews,
.op__phone-foot,
.op__overlay {
  display: none;
}

.op__bar-chat {
  flex: none;
  width: 52px;
}

.op__bar {
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  gap: 8px;
}

@media (max-width: 1099px) {
  .op__grid {
    grid-template-columns: minmax(0, 1fr) 300px;
  }

  .op__more {
    max-width: none;
  }

  .op__more-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .op {
    padding: 0 0 24px;
  }

  .op__notice {
    margin: 12px 12px 0;
  }

  .op__head,
  .op__aside,
  .op__reviews,
  .op__more {
    display: none;
  }

  .op__grid {
    grid-template-columns: 1fr;
  }

  .op__main {
    gap: 12px;
  }

  .op__gallery {
    padding: 0;
    border-radius: 0;
    background: none;
  }

  .op__overlay {
    padding: 12px;
    display: flex;
    justify-content: space-between;
  }

  .op__overlay-end {
    display: flex;
    gap: 8px;
    /* The host close button may sit at the top right (lib/host-insets.ts). */
    margin-right: max(0px, calc(var(--host-corner, 0px) - 12px));
  }

  .op__round {
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-full);
    background: var(--on-photo-button);
    color: #16161d;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .op__fav {
    width: 44px;
    height: 44px;
  }

  .op__phone-head {
    margin-top: -12px;
    padding: 16px;
    border-radius: 0 0 var(--radius-l) var(--radius-l);
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .op__phone-title {
    font-size: 20px;
    line-height: 26px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .op__phone-meta {
    color: var(--text2);
    font-size: 13px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .op__phone-safe {
    margin-top: 6px;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--success-soft);
    font-size: 13px;
    line-height: 18px;
    display: flex;
    gap: 8px;
  }

  .op__phone-safe .ui-icon {
    flex: none;
    color: var(--success);
  }

  .op__safe {
    display: none;
  }

  .op__phone-seller {
    display: block;
  }

  .op__phone-reviews {
    display: flex;
  }

  .op__phone-foot {
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--text3);
    font-size: 13px;
  }

  .op__main > :deep(section),
  .op__phone-foot {
    margin: 0 12px;
  }

  .op__main > .op__gallery,
  .op__main > .op__phone-head {
    margin: 0;
  }
}
</style>
