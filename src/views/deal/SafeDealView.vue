<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAccount, useRates } from '@/api/queries'
import DealActionCard from '@/components/deal/DealActionCard.vue'
import DealParticipants, { type DealPerson } from '@/components/deal/DealParticipants.vue'
import DealReview from '@/components/deal/DealReview.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import SystemState from '@/components/system/SystemState.vue'
import { cabinetRoute } from '@/composables/cabinet'
import { useChat } from '@/composables/chat'
import { useDeal, useDealTransfer, useSafeDealSupported } from '@/composables/safe-deal'
import { bastyonAppLink } from '@/config/links'
import { formatAgo, formatPkoin } from '@/lib/format'
import { offerPkoin } from '@/models/offer'
import { dealStep, feeVariantOf, parseDealQuery, type DealRole } from '@/models/safe-deal'
import { useDealsStore } from '@/stores/deals'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'
import UiAlert from '@/ui/UiAlert.vue'
import UiBadge, { type BadgeTone } from '@/ui/UiBadge.vue'
import UiBreadcrumbs from '@/ui/UiBreadcrumbs.vue'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiTracker from '@/ui/UiTracker.vue'

/**
 * `/barter/safedeal?id=…&offer=…&buyer=…&validator=…&fee=…` (old route
 * «SafeDeal»; s7-dealbuyer, s7-dealvalidator, s7-dealmatrix, s7-dealstates):
 * one page for the buyer, the seller and the guarantor. The status comes
 * from the chain; only the one whose move it is gets a button.
 */
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const session = useSessionStore()
const ui = useUiStore()
const deals = useDealsStore()
const context = useCardContext()
const rates = useRates()
const chat = useChat()
const supported = useSafeDealSupported()

const parsed = computed(() => parseDealQuery(route.query))
const params = computed(() => (parsed.value.problem === null ? parsed.value.params : null))
const deal = useDeal(params)
const state = computed(() => deal.state.value)
const role = computed(() => deal.role.value)
const offer = computed(() => deal.offer.value)

/** What is wrong with the link: from the link itself, or, once the offer is read, its seller in a second part. */
const problem = computed(
  () => parsed.value.problem ?? (deal.conflict.value ? ('participants' as const) : null)
)

const page = computed(() => {
  if (problem.value) return 'bad'
  if (session.status !== 'ready' || session.account === 'unknown') return 'loading'
  if (!supported.value) return 'unsupported'
  if (session.account !== 'signed-in') return 'signin'
  if (deal.offerQuery.isPending.value) return 'loading'
  if (deal.offerQuery.isError.value) return 'error'
  if (!offer.value) return 'noOffer'
  if (!role.value) return 'noAccess'
  if (state.value) return 'ready'
  if (deal.error.value) return 'error'
  return 'loading'
})

// A deal I take part in goes to «Сделки» on this device.
watch(
  () => (role.value && params.value ? params.value : null),
  (p) => p && deals.remember(p),
  { immediate: true }
)

// ─── People ─────────────────────────────────────────────────────────────────
const addresses = computed<Record<DealRole, string>>(() => ({
  buyer: params.value?.buyer ?? '',
  seller: deal.seller.value ?? '',
  validator: params.value?.validator ?? '',
}))
const sellerAccount = useAccount(() => deal.seller.value)
const name = (address: string) => deal.people.value.get(address)?.name || t('deal.someone')
const names = computed<Record<DealRole, string>>(() => ({
  buyer: name(addresses.value.buyer),
  seller: name(addresses.value.seller),
  validator: name(addresses.value.validator),
}))
const fee = computed(() => Number(params.value?.fee ?? 0))
const pct = (value: number) =>
  new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value)
const participants = computed<DealPerson[]>(() =>
  (['buyer', 'seller', 'validator'] as const).map((r) => {
    const address = addresses.value[r]
    const account = r === 'seller' ? sellerAccount.data.value : null
    return {
      role: r,
      address,
      name: names.value[r],
      avatar: deal.people.value.get(address)?.avatar ?? null,
      you: role.value === r,
      meta:
        r === 'validator'
          ? t('deal.aside.fee', { fee: pct(fee.value) })
          : account?.ratingCount
            ? `${new Intl.NumberFormat(locale.value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(account.rating)} ★`
            : undefined,
    }
  })
)

// ─── Offer ──────────────────────────────────────────────────────────────────
const card = computed(() => (offer.value ? offerCardData(offer.value, context.value) : null))
const listed = computed(() => (offer.value ? offerPkoin(offer.value, rates.data.value) : null))
const offerTo = computed(() =>
  params.value ? { name: 'barterItem', params: { id: params.value.offer } } : null
)

// ─── Status ─────────────────────────────────────────────────────────────────
const step = computed(() => (state.value ? dealStep(state.value.status) : 1))
const finished = computed(() => state.value?.status === '4a' || state.value?.status === '4b')
const statusName = computed(() => (state.value ? t(`deal.status.s${state.value.status}`) : ''))
const tracker = computed(() => {
  const s = state.value
  return [
    { title: t('deal.tracker.s1'), text: t('deal.tracker.s1Text') },
    {
      title: t('deal.tracker.s2'),
      text:
        s && s.paid > 0
          ? t('deal.tracker.s2Paid', { amount: formatPkoin(s.paid, locale.value) })
          : t('deal.tracker.s2Text'),
    },
    { title: t('deal.tracker.s3'), text: t('deal.tracker.s3Text') },
    {
      title: finished.value ? statusName.value : t('deal.tracker.s4'),
      text: role.value === 'buyer' ? t('deal.tracker.s4Buyer') : t('deal.tracker.s4Text'),
    },
  ]
})
const updated = computed(() =>
  deal.updatedAt.value
    ? t('deal.updated', { ago: formatAgo(deal.updatedAt.value, locale.value) })
    : ''
)
const roleTone: Record<DealRole, BadgeTone> = {
  buyer: 'primary',
  seller: 'pkoin',
  validator: 'success',
}
const stale = computed(() => !!deal.error.value && !!state.value)
const lastKnown = computed(() => (state.value ? `${state.value.status} · ${statusName.value}` : ''))

// ─── Chat and transfers ─────────────────────────────────────────────────────
const transfer = useDealTransfer(
  params,
  () => offer.value?.caption ?? '',
  () => deal.others.value
)
function openChat() {
  void chat.open({
    name: offer.value?.caption ?? '',
    members: deal.others.value,
    messages: [],
    notify: false,
  })
}
const send = (request: { to: string; amount: number; feemode: 'exclude' | 'include' }) =>
  transfer.send({ ...request, status: state.value!.status })

const back = computed(() => cabinetRoute(session.address, 'deals'))
const crumbs = computed(() => [
  { label: t('cabinet.nav'), to: cabinetRoute(session.address) },
  { label: t('deal.crumb'), to: back.value },
  { label: offer.value?.caption ?? t('deal.title') },
])
</script>

<template>
  <AppLayout>
    <template #mobile-top>
      <PageTopBar :title="t('deal.title')" :back="back">
        <button
          v-if="page === 'ready'"
          type="button"
          class="sd__topchat"
          :aria-label="t('deal.chat')"
          @click="openChat"
        >
          <UiIcon name="chat" :size="22" />
        </button>
      </PageTopBar>
    </template>

    <div class="sd container" data-testid="deal-page" :data-state="page" :data-role="role ?? ''">
      <!-- Not a deal page for me, or not one at all. -->
      <UiEmptyState
        v-if="page === 'bad'"
        class="sd__panel"
        icon="warning"
        :title="t('deal.bad.title')"
        :text="t(`deal.bad.${problem}`)"
        data-testid="deal-bad"
      >
        <UiButton
          v-if="parsed.params"
          variant="outline"
          :to="{ name: 'barterItem', params: { id: parsed.params.offer } }"
          >{{ t('deal.noAccess.toOffer') }}</UiButton
        >
      </UiEmptyState>
      <!-- s8-system-desktop «Bastyon устарел». -->
      <SystemState
        v-else-if="page === 'unsupported'"
        class="sd__panel"
        kind="outdated"
        icon="arrow-up"
        tone="warning"
        :title="t('system.outdated.title')"
        :text="t('deal.unsupported.text')"
        :notes="[{ ok: true, text: t('system.outdated.works') }]"
        data-testid="deal-unsupported"
      >
        <UiButton :href="bastyonAppLink(route.fullPath)" external>{{
          t('system.outdated.web')
        }}</UiButton>
        <UiButton variant="ghost" @click="router.back()">{{ t('system.outdated.skip') }}</UiButton>
      </SystemState>
      <UiEmptyState
        v-else-if="page === 'signin'"
        class="sd__panel"
        icon="lock"
        :title="t('deal.signIn.title')"
        :text="t('deal.signIn.text')"
        data-testid="deal-signin"
      >
        <UiButton @click="session.ensureSignedIn()">{{ t('deal.signIn.action') }}</UiButton>
      </UiEmptyState>
      <UiEmptyState
        v-else-if="page === 'noOffer'"
        class="sd__panel"
        icon="search-empty"
        :title="t('deal.noOffer.title')"
        :text="t('deal.noOffer.text')"
      />
      <UiEmptyState
        v-else-if="page === 'noAccess'"
        class="sd__panel"
        icon="lock"
        :title="t('deal.noAccess.title')"
        :text="t('deal.noAccess.text')"
        data-testid="deal-no-access"
      >
        <UiButton v-if="offerTo" variant="ghost" :to="offerTo">{{
          t('deal.noAccess.toOffer')
        }}</UiButton>
      </UiEmptyState>
      <section v-else-if="page === 'error'" class="sd__panel sd__card" data-testid="deal-error">
        <UiAlert tone="danger" :title="t('deal.error.title')" live>{{
          t('deal.error.text')
        }}</UiAlert>
        <UiButton
          variant="outline"
          icon="retry"
          :loading="deal.refreshing.value"
          @click="deal.refresh()"
          >{{ t('deal.refresh') }}</UiButton
        >
      </section>

      <template v-else-if="page === 'loading'">
        <UiSkeleton width="40%" :ratio="'12 / 1'" radius="8px" />
        <UiSkeleton width="100%" :ratio="'10 / 1'" radius="16px" />
        <div class="sd__grid">
          <UiSkeleton width="100%" :ratio="'4 / 3'" radius="20px" />
          <UiSkeleton width="100%" :ratio="'3 / 4'" radius="20px" />
        </div>
      </template>

      <template v-else-if="state && role && params">
        <UiBreadcrumbs class="sd__crumbs" :items="crumbs" />

        <header class="sd__head">
          <h1 class="sd__title">{{ t('deal.title') }}</h1>
          <UiBadge :tone="roleTone[role]">{{ t(`deal.youAre.${role}`) }}</UiBadge>
          <span class="sd__updated">{{ updated }}</span>
          <UiButton
            variant="secondary"
            icon="retry"
            :loading="deal.refreshing.value"
            data-testid="deal-refresh"
            @click="deal.refresh()"
            >{{ t('deal.refresh') }}</UiButton
          >
          <UiButton variant="neutral" external :loading="chat.opening.value" @click="openChat">{{
            t('deal.chat')
          }}</UiButton>
        </header>

        <section class="sd__tracker sd__card">
          <UiTracker :steps="tracker" :current="finished ? 4 : step - 1" />
        </section>

        <!-- Phone: the status in one card (s7-dealbuyer-mobile). -->
        <section class="sd__mstatus sd__card" data-testid="deal-status">
          <div class="sd__mstatus-top">
            <UiBadge :tone="roleTone[role]">{{ t(`deal.youAre.${role}`) }}</UiBadge>
            <span class="sd__muted">{{ t('deal.statusOf', { n: step }) }}</span>
          </div>
          <h2 class="sd__mstatus-title">{{ statusName }}</h2>
          <div class="sd__bars" aria-hidden="true">
            <span v-for="n in 4" :key="n" :class="{ on: n <= step }" />
          </div>
          <p v-if="state.status === '1' || state.status === '2'" class="sd__muted">
            {{ state.status === '1' ? t('deal.next1') : t('deal.next2') }}
          </p>
        </section>

        <UiAlert
          v-if="stale"
          tone="danger"
          :title="t('deal.error.title')"
          live
          data-testid="deal-stale"
        >
          {{ t('deal.error.text') }} {{ t('deal.error.last', { status: lastKnown }) }}
        </UiAlert>

        <div class="sd__grid">
          <div class="sd__main">
            <DealActionCard
              :role="role"
              :state="state"
              :fee-percent="fee"
              :variant="feeVariantOf(offer)"
              :listed="listed"
              :sending="deal.sending.value"
              :just-sent="!!transfer.sent.value"
              :failure="transfer.failure.value"
              :busy="transfer.sending.value"
              :stale="stale"
              :seller-banned="deal.sellerBanned.value"
              :refreshing="deal.refreshing.value"
              :names="names"
              :addresses="addresses"
              :send="send"
              @refresh="deal.refresh()"
            >
              <template #result>
                <DealReview
                  v-if="role === 'buyer' && state.status === '4a' && offer"
                  :offer="offer"
                />
              </template>
            </DealActionCard>

            <section class="sd__mrefresh sd__card">
              <p v-if="!finished" class="sd__muted">{{ t('deal.hint') }}</p>
              <UiButton
                variant="outline"
                block
                :loading="deal.refreshing.value"
                @click="deal.refresh()"
                >{{ t('deal.refresh') }}</UiButton
              >
              <button type="button" class="sd__link" @click="ui.openSafeDealHelp()">
                {{ t('deal.aside.how') }}
              </button>
            </section>
          </div>

          <aside class="sd__aside">
            <RouterLink
              v-if="card && offerTo"
              :to="offerTo"
              class="sd__offer sd__card"
              data-testid="deal-offer"
            >
              <OfferPhoto class="sd__offer-photo" :src="card.photo" ratio="4 / 3" radius="10px" />
              <span class="sd__offer-body">
                <span class="sd__offer-title">{{ offer?.caption }}</span>
                <span class="sd__muted">{{
                  listed !== null
                    ? t('deal.aside.inOffer', { price: formatPkoin(listed, locale) })
                    : ''
                }}</span>
              </span>
            </RouterLink>
            <div class="sd__card">
              <DealParticipants :people="participants" titled />
            </div>
            <div v-if="role === 'buyer' && !finished" class="sd__card sd__next">
              <h2>{{ t('deal.aside.next') }}</h2>
              <p class="sd__muted">{{ t('deal.aside.nextText') }}</p>
              <button type="button" class="sd__link" @click="ui.openSafeDealHelp()">
                {{ t('deal.aside.how') }}
              </button>
            </div>
            <button v-else type="button" class="sd__link sd__how" @click="ui.openSafeDealHelp()">
              {{ t('deal.aside.how') }}
            </button>
            <p class="sd__number">{{ t('deal.aside.number', { id: params.id }) }}</p>
          </aside>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<style scoped>
.sd {
  padding-top: 20px;
  padding-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sd__card {
  padding: 20px;
  border-radius: var(--radius-xl);
  background: var(--surface);
}

.sd__panel {
  max-width: 560px;
  margin: 40px auto;
}

section.sd__panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.sd__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.sd__title {
  font-size: 32px;
  line-height: 40px;
  font-weight: 700;
}

.sd__updated {
  margin-left: auto;
  color: var(--text2);
  font-size: 13px;
}

.sd__tracker {
  padding: 24px;
}

.sd__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: 24px;
}

.sd__main,
.sd__aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sd__offer {
  display: flex;
  align-items: center;
  gap: 16px;
  color: inherit;
  text-decoration: none;
}

.sd__offer-photo {
  width: 80px;
  flex: none;
}

.sd__offer-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sd__offer-title {
  color: var(--link);
  font-weight: 600;
  font-size: 15px;
  line-height: 20px;
}

.sd__next {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sd__next h2 {
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
}

.sd__muted {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.sd__link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.sd__how {
  padding: 0 4px;
}

.sd__number {
  padding: 0 4px;
  color: var(--text3);
  font: 12px / 16px var(--font-mono);
  word-break: break-all;
}

.sd__mstatus,
.sd__mrefresh,
.sd__topchat {
  display: none;
}

@media (max-width: 1023px) {
  .sd__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 767px) {
  .sd {
    padding-top: 12px;
    padding-bottom: 24px;
    gap: 12px;
  }

  .sd__crumbs,
  .sd__head,
  .sd__tracker {
    display: none;
  }

  .sd__card {
    padding: 16px;
    border-radius: var(--radius-l);
  }

  .sd__topchat {
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--text);
    display: grid;
    place-items: center;
  }

  .sd__mstatus {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sd__mstatus-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sd__mstatus-title {
    font-size: 20px;
    line-height: 26px;
    font-weight: 700;
  }

  .sd__bars {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .sd__bars span {
    height: 4px;
    border-radius: 2px;
    background: var(--muted);
  }

  .sd__bars span.on {
    background: var(--primary);
  }

  .sd__grid {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  /* Phone order: the offer and the people first, then what to do. */
  .sd__aside {
    order: -1;
    gap: 12px;
  }

  .sd__next,
  .sd__how,
  .sd__number {
    display: none;
  }

  .sd__mrefresh {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .sd__mrefresh .sd__link {
    align-self: center;
  }
}
</style>
