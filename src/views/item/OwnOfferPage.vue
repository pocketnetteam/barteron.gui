<script setup lang="ts">
import { computed, defineAsyncComponent, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/item/ConfirmDialog.vue'
import ItemExchange from '@/components/item/ItemExchange.vue'
import ItemGallery from '@/components/item/ItemGallery.vue'
import ItemNotice from '@/components/item/ItemNotice.vue'
import ItemOwnBox from '@/components/item/ItemOwnBox.vue'
import ItemReviews from '@/components/item/ItemReviews.vue'
import ItemSection from '@/components/item/ItemSection.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import NetStatusBadge from '@/components/net/NetStatusBadge.vue'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import ExchangeTile from '@/components/exchange/ExchangeTile.vue'
import { exchangeItems } from '@/components/exchange/exchange-ui'
import { useOfferExchanges } from '@/composables/exchanges'
import { useOfferActions } from '@/composables/offer-actions'
import { useOfferPage } from '@/composables/offer-page'
import { useOfferReviews } from '@/composables/offer-reviews'
import { txErrorText } from '@/lib/tx-errors'
import { offerLifecycle, type Offer } from '@/models/offer'
import { useAutorenewStore } from '@/stores/autorenew'
import { useSessionStore } from '@/stores/session'
import { useTxStore } from '@/stores/tx'
import { showToast } from '@/ui/toast'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSwitch from '@/ui/UiSwitch.vue'

const PhotoViewer = defineAsyncComponent(() => import('@/components/item/PhotoViewer.vue'))
const PromoteDialog = defineAsyncComponent(() => import('@/components/item/PromoteDialog.vue'))

/** My own offer (s3-itemown-desktop / s3-itemown-mobile, s3-item-states «Своё · …»). */
const props = defineProps<{ offer: Offer }>()

const { t } = useI18n()
const router = useRouter()
const session = useSessionStore()
const tx = useTxStore()
const autorenew = useAutorenewStore()
const cardCtx = useCardContext()

const offer = toRef(props, 'offer')
const page = useOfferPage(offer)
const id = page.id
const actions = useOfferActions(offer)

const lifecycle = computed(() => {
  const state = offerLifecycle(offer.value)
  return state === 'withdrawn' || state === 'expired' ? state : 'active'
})
const op = computed(() => actions.operation.value)
/** While a new version is on its way, show it: the price the owner just set. */
const shown = computed(() => actions.pendingVersion.value ?? offer.value)
const shownCard = computed(() =>
  offerCardData(shown.value, { ...cardCtx.value, sellerList: page.seller.data.value?.tags })
)
const oldPrice = computed(() =>
  actions.pendingVersion.value && actions.pendingVersion.value.priceCents !== offer.value.priceCents
    ? page.card.value.price
    : null
)

// ─── Matches ────────────────────────────────────────────────────────────────
// Only a live offer is matched; the cache is shared with the exchanges section.
const matches = useOfferExchanges(() => (lifecycle.value === 'active' ? offer.value : null))
const matchItems = computed(() =>
  matches.state.value?.exchanges ? exchangeItems(matches.state.value.exchanges) : []
)
const matchesRoute = computed(() => ({
  name: 'exchangeOptions',
  params: { id: id.value },
  query: { expanded: '1' },
}))
const editRoute = computed(() => ({ name: 'createBarter', params: { id: id.value } }))

// ─── Reviews: the author may answer ─────────────────────────────────────────
const reviews = useOfferReviews(offer)

// ─── Actions ────────────────────────────────────────────────────────────────
const confirm = ref<'withdraw' | 'renew' | 'remove' | null>(null)
const confirmOpen = computed({
  get: () => confirm.value !== null,
  set: (value) => {
    if (!value) confirm.value = null
  },
})
const promoteOpen = ref(false)

function run() {
  const action = confirm.value
  confirm.value = null
  try {
    if (action === 'withdraw') void actions.withdraw()
    else if (action === 'renew') void actions.renew()
    else if (action === 'remove') void actions.remove()
  } catch (error) {
    console.error('[barteron] offer action failed:', error)
    showToast(t('item.own.invalid'), { kind: 'error' })
  }
}

/** Deleted: there is nothing left to show here. */
watch(
  () => tx.latestFor(id.value, ['offerRemove']),
  (latest) => {
    if (latest?.status === 'done') {
      showToast(t('item.own.removed'))
      void router.replace({ name: 'profile', params: { id: session.address ?? '' }, hash: '#ads' })
    }
  },
  { deep: true }
)

const autorenewOn = computed({
  get: () => autorenew.isOn(id.value),
  set: (value) => autorenew.setOn(id.value, value),
})

const notice = computed(() => {
  const o = op.value
  if (o?.kind === 'publishing')
    return {
      tone: 'warning' as const,
      spinner: true,
      title: t('item.state.publishing'),
      text: t('item.state.publishingText'),
    }
  if (o?.kind === 'updating')
    return {
      tone: 'warning' as const,
      spinner: true,
      title: t('item.state.updating'),
      text: t('item.state.updatingText'),
    }
  if (o?.kind === 'withdrawing')
    return {
      tone: 'warning' as const,
      spinner: true,
      title: t('item.state.withdrawing'),
      text: t('item.state.withdrawingText'),
    }
  if (o?.kind === 'removing')
    return {
      tone: 'warning' as const,
      spinner: true,
      title: t('item.state.removing'),
      text: t('item.state.removingText'),
    }
  if (o?.kind === 'failed')
    return {
      tone: 'danger' as const,
      icon: 'error' as const,
      title: t('item.state.failed'),
      text: txErrorText(o.tx.error, t),
    }
  if (lifecycle.value === 'withdrawn')
    return {
      tone: 'neutral' as const,
      icon: 'withdraw' as const,
      title: t('item.state.withdrawn'),
      text: t('item.state.withdrawnSince', { date: page.published.value }),
    }
  if (lifecycle.value === 'expired')
    return {
      tone: 'neutral' as const,
      icon: 'clock' as const,
      title: t('item.state.expired'),
      text: t('item.state.expiredSince', { date: page.till.value }),
    }
  return null
})

const viewerOpen = ref(false)
const viewerIndex = ref(0)
function openViewer(index: number) {
  viewerIndex.value = index
  viewerOpen.value = true
}
function openBoost() {
  void session.sdk?.openExternalLink('https://bastyon.com/boost').catch(() => null)
}
function back() {
  if (window.history.state?.back) router.back()
  else void router.push({ name: 'home' })
}
</script>

<template>
  <AppLayout :scope="offer.tag">
    <template #mobile-top>
      <div class="ow-top">
        <button type="button" class="ow-top__btn" :aria-label="t('ui.back')" @click="back">
          <UiIcon name="back" :size="24" :stroke="2" />
        </button>
        <span class="ow-top__title">{{ t('item.own.title') }}</span>
        <button
          type="button"
          class="ow-top__btn"
          :aria-label="t('item.share')"
          @click="page.share()"
        >
          <UiIcon name="share" :size="22" />
        </button>
      </div>
    </template>

    <div class="ow container" data-testid="item-page" data-kind="own">
      <ItemNotice
        v-if="notice"
        class="ow__notice"
        :tone="notice.tone"
        :spinner="notice.spinner"
        :icon="notice.icon"
        :title="notice.title"
        :text="notice.text"
        data-testid="own-notice"
      />
      <ItemNotice v-else class="ow__notice ow__desk" tone="surface">
        <template #lead><NetStatusBadge status="done" /></template>
        {{ t('item.own.activeTill', { date: page.till.value }) }}
        <template #end>
          <label class="ow__switch">
            {{ t('item.own.autorenew') }}
            <UiSwitch v-model="autorenewOn" data-testid="own-autorenew" />
          </label>
          <RouterLink :to="{ name: 'barterItem', params: { id }, query: { view: 'buyer' } }">
            {{ t('item.own.asBuyer') }}
          </RouterLink>
        </template>
      </ItemNotice>

      <div class="ow__grid">
        <div class="ow__main">
          <div class="ow__head ow__desk">
            <h1 class="ow__title" data-testid="item-title">{{ shown.caption }}</h1>
            <p class="ow__meta">
              {{ page.categoryName.value }} ·
              {{ t('item.published', { date: page.published.value }) }} · №
              <span class="mono">{{ page.number.value }}</span>
            </p>
          </div>

          <!-- Phone: summary card with the main actions -->
          <section class="ow__phone-card">
            <div class="ow__phone-summary">
              <OfferPhoto
                class="ow__phone-photo"
                :src="shownCard.photo"
                ratio="4 / 3"
                radius="12px"
              />
              <div class="ow__phone-text">
                <strong class="ow__phone-title">{{ shown.caption }}</strong>
                <PriceTag :price="shownCard.price" :size="18" no-equivalent />
                <NetStatusBadge
                  v-if="lifecycle === 'active' && !op"
                  status="done"
                  :label="t('item.own.activeShort', { date: page.till.value })"
                />
              </div>
            </div>
            <template v-if="lifecycle === 'active' && !op">
              <UiButton :size="52" block icon="exchange" :to="matchesRoute">
                {{
                  matchItems.length
                    ? t('item.own.findCount', { n: matchItems.length })
                    : t('item.own.find')
                }}
              </UiButton>
              <div class="ow__pair">
                <UiButton variant="neutral" :size="48" block :to="editRoute">{{
                  t('item.own.edit')
                }}</UiButton>
                <UiButton variant="pkoin" :size="48" block @click="promoteOpen = true">{{
                  t('item.own.promote')
                }}</UiButton>
              </div>
              <label class="ow__switch ow__switch--row">
                {{ t('item.own.autorenew') }}
                <UiSwitch v-model="autorenewOn" />
              </label>
            </template>
            <ItemOwnBox
              v-else
              class="ow__phone-box"
              :price="shownCard.price"
              :old-price="oldPrice"
              :lifecycle="lifecycle"
              :operation="op"
              :can-renew="actions.canRenew.value"
              @renew="confirm = 'renew'"
              @remove="confirm = 'remove'"
              @retry="actions.retry()"
              @edit="router.push(editRoute)"
              @share="page.share()"
            />
          </section>

          <div class="ow__gallery ow__desk">
            <ItemGallery
              variant="own"
              :slides="page.slides.value"
              :title="shown.caption"
              :inactive="lifecycle !== 'active'"
              @open="openViewer"
            />
          </div>

          <ItemSection
            v-if="lifecycle === 'active'"
            :title="
              matchItems.length
                ? t('item.own.matchesCount', { n: matchItems.length })
                : t('item.own.matches')
            "
            :subtitle="t('item.own.matchesText')"
            heading-id="own-matches"
          >
            <template #end>
              <RouterLink v-if="matchItems.length" :to="matchesRoute">{{
                t('item.own.matchesAll')
              }}</RouterLink>
            </template>
            <p v-if="matches.state.value?.status === 'pending'" class="ow__muted">
              {{ t('item.own.matchesLoading') }}
            </p>
            <p v-else-if="!matchItems.length" class="ow__muted">{{ t('item.own.matchesNone') }}</p>
            <div v-else class="ow__matches">
              <ExchangeTile
                v-for="m in matchItems.slice(0, 4)"
                :key="m.key"
                class="ow__match"
                :offer="m.offer"
                :kind="m.kind"
                :to="m.to"
              />
            </div>
          </ItemSection>

          <ItemExchange
            :title="t('item.own.wants')"
            :items="shownCard.exchange ?? []"
            :anything="shownCard.exchangeAnything"
            :free="shownCard.price.free && !shownCard.exchange?.length"
            own
            edit-to
            @edit="router.push(editRoute)"
          />

          <ItemReviews
            :average="reviews.average.value"
            :rows="reviews.rows.value"
            :form="reviews.rows.value.length ? 'comment' : 'none'"
            :sending="reviews.sending.value"
            own
            @submit="reviews.submit"
            @preview="router.push({ name: 'barterItem', params: { id }, query: { view: 'buyer' } })"
          />

          <!-- Phone: the rest of the actions as rows -->
          <section v-if="lifecycle === 'active' && !op" class="ow__rows">
            <RouterLink
              class="ow__row"
              :to="{ name: 'barterItem', params: { id }, query: { view: 'buyer' } }"
            >
              {{ t('item.own.asBuyer') }}
              <UiIcon name="chevron-right" :size="18" :stroke="2" />
            </RouterLink>
            <button type="button" class="ow__row" @click="confirm = 'withdraw'">
              {{ t('item.own.withdraw') }}
              <UiIcon name="chevron-right" :size="18" :stroke="2" />
            </button>
            <button type="button" class="ow__row ow__row--danger" @click="confirm = 'remove'">
              {{ t('item.own.remove') }}
            </button>
          </section>
          <p class="ow__foot-note ow__phone">{{ t('item.own.noteShort') }}</p>
        </div>

        <aside class="ow__aside">
          <ItemOwnBox
            :price="shownCard.price"
            :old-price="oldPrice"
            :lifecycle="lifecycle"
            :operation="op"
            :matches="matchItems.length"
            :can-renew="actions.canRenew.value"
            @find="router.push(matchesRoute)"
            @edit="router.push(editRoute)"
            @share="page.share()"
            @promote="promoteOpen = true"
            @withdraw="confirm = 'withdraw'"
            @renew="confirm = 'renew'"
            @remove="confirm = 'remove'"
            @retry="actions.retry()"
          />
          <p class="ow__note">{{ t('item.own.note') }}</p>
        </aside>
      </div>
    </div>
  </AppLayout>

  <ConfirmDialog
    v-model:open="confirmOpen"
    :title="
      confirm === 'remove'
        ? t('item.confirm.removeTitle')
        : confirm === 'withdraw'
          ? t('item.confirm.withdrawTitle')
          : t('item.confirm.renewTitle')
    "
    :text="
      confirm === 'remove'
        ? t('item.confirm.removeText', { title: offer.caption })
        : confirm === 'withdraw'
          ? t('item.confirm.withdrawText', { title: offer.caption })
          : t('item.confirm.renewText', { title: offer.caption })
    "
    :confirm="
      confirm === 'remove'
        ? t('item.confirm.remove')
        : confirm === 'withdraw'
          ? t('item.confirm.withdraw')
          : t('item.confirm.renew')
    "
    :danger="confirm === 'remove'"
    @confirm="run"
  />
  <PromoteDialog
    v-if="promoteOpen"
    v-model:open="promoteOpen"
    @share="((promoteOpen = false), page.share())"
    @more="openBoost"
  />
  <PhotoViewer
    v-if="viewerOpen"
    v-model:open="viewerOpen"
    v-model:index="viewerIndex"
    :slides="page.slides.value"
    :title="shown.caption"
    @retry-video="page.retryVideo()"
  />
</template>

<style scoped>
.ow {
  padding-top: 20px;
  padding-bottom: 48px;
}

.ow__notice {
  margin-bottom: 20px;
}

.ow__switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  cursor: pointer;
}

.ow__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.ow__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ow__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ow__title {
  font-size: 32px;
  line-height: 38px;
  font-weight: 800;
  letter-spacing: -0.4px;
  overflow-wrap: anywhere;
}

.ow__meta {
  color: var(--text2);
  font-size: 14px;
}

.ow__gallery {
  padding: 16px;
  border-radius: var(--radius-xl);
  background: var(--surface);
}

.ow__aside {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ow__note {
  padding: 20px 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.ow__muted {
  color: var(--text2);
}

.ow__matches {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.ow__phone-card,
.ow__rows,
.ow__phone {
  display: none;
}

.ow-top {
  min-height: 56px;
  /* The host close button may sit at the top right (lib/host-insets.ts). */
  padding: 6px max(8px, var(--host-corner, 0px)) 6px 8px;
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 8px;
}

.ow-top__btn {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ow-top__title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
}

@media (max-width: 1099px) {
  .ow__grid {
    grid-template-columns: minmax(0, 1fr) 300px;
  }

  .ow__matches {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .ow {
    padding: 12px 12px 24px;
  }

  .ow__desk,
  .ow__aside {
    display: none;
  }

  .ow__grid {
    grid-template-columns: 1fr;
  }

  .ow__main {
    gap: 12px;
  }

  .ow__notice {
    margin-bottom: 12px;
  }

  .ow__phone-card {
    padding: 16px;
    border-radius: var(--radius-l);
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ow__phone-box {
    padding: 0;
  }

  .ow__phone-summary {
    display: flex;
    gap: 12px;
  }

  .ow__phone-photo {
    width: 112px;
    flex: none;
  }

  .ow__phone-text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .ow__phone-title {
    font-size: 16px;
    line-height: 22px;
  }

  .ow__pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .ow__switch--row {
    padding-top: 12px;
    border-top: 1px solid var(--border);
    justify-content: space-between;
  }

  .ow__matches {
    display: flex;
    overflow-x: auto;
    gap: 12px;
    scrollbar-width: none;
  }

  .ow__match {
    flex: none;
    width: 150px;
  }

  .ow__rows {
    border-radius: var(--radius-l);
    background: var(--surface);
    display: flex;
    flex-direction: column;
  }

  .ow__row {
    min-height: 52px;
    padding: 0 16px;
    border: 0;
    border-top: 1px solid var(--border);
    background: none;
    color: var(--text);
    font: 500 15px / 20px var(--font-sans);
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
  }

  .ow__row:first-child {
    border-top: 0;
  }

  .ow__row--danger {
    color: var(--danger);
  }

  .ow__phone {
    display: block;
  }

  .ow__foot-note {
    padding: 0 4px;
    color: var(--text3);
    font-size: 13px;
    line-height: 18px;
  }
}
</style>
