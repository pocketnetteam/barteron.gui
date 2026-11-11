<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAccount, useOffersByIds, useRates } from '@/api/queries'
import { chainRefOf } from '@/models/exchange'
import { offerRoute, optionsRoute } from '@/components/exchange/exchange-ui'
import ProposeDialog from '@/components/exchange/ProposeDialog.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import { cabinetRoute } from '@/composables/cabinet'
import { useChat } from '@/composables/chat'
import { useOfferExchanges, usePeople } from '@/composables/exchanges'
import { formatPkoin } from '@/lib/format'
import {
  chainPath,
  chainProblem,
  chainSteps,
  parseChainRef,
  priceGap,
  viewerRole,
  type ExchangeChain,
} from '@/models/exchange'
import { isOfferActive, offerPkoin } from '@/models/offer'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiBreadcrumbs from '@/ui/UiBreadcrumbs.vue'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import { chainRoute } from '@/components/exchange/exchange-ui'

/**
 * `/barter/search?source=…&target=…[&via=…]` (old route «Групповой обмен»;
 * s6-chain-desktop / -mobile): one chain of three. The old link has no
 * `via`: the chain is then found again among the chains of the source.
 * Participants open it from the group chat and see it from their side.
 */
const route = useRoute()
const { t, locale } = useI18n()
const session = useSessionStore()
const context = useCardContext()
const rates = useRates()
const chat = useChat()

const chainRef = computed(() => parseChainRef(route.query))
const ids = computed(() => {
  const r = chainRef.value
  return r ? [r.source, r.target, ...(r.via ? [r.via] : [])] : []
})
const offers = useOffersByIds(ids)
const byId = (id: string | null | undefined) =>
  (id && offers.data.value?.find((o) => o.hash === id)) || null

const source = computed(() => byId(chainRef.value?.source))
const mine = computed(() => !!source.value && source.value.address === session.address)
/**
 * The source's other chains: «Другие цепочки» for its owner, and the chain
 * itself for an old link without `via`. Someone else's link is matched
 * everywhere, not in my search area.
 */
const needMatches = computed(() => mine.value || !chainRef.value?.via)
const matches = useOfferExchanges(
  () => (needMatches.value && source.value && isOfferActive(source.value) ? source.value : null),
  { anywhere: () => !mine.value }
)
const found = computed(() => matches.state.value?.exchanges?.chains ?? [])

const chain = computed<ExchangeChain | null>(() => {
  const r = chainRef.value
  if (!r || !source.value) return null
  if (r.via) {
    const via = byId(r.via)
    const target = byId(r.target)
    return via && target ? { source: source.value, via, target } : null
  }
  return found.value.find((c) => c.target.hash === r.target) ?? null
})
const problem = computed(() => {
  const r = chainRef.value
  if (!r?.via) return null
  return chainProblem({ source: source.value, via: byId(r.via), target: byId(r.target) })
})
const others = computed(() =>
  found.value
    .filter(
      (c) =>
        !chain.value ||
        c.target.hash !== chain.value.target.hash ||
        c.via.hash !== chain.value.via.hash
    )
    .slice(0, 3)
)

const page = computed(() => {
  if (!chainRef.value) return 'bad'
  if (offers.isPending.value && session.status !== 'failed') return 'loading'
  if (offers.isError.value) return 'error'
  if (problem.value) return 'broken'
  if (chain.value) return 'ready'
  if (!chainRef.value.via && source.value && matches.state.value?.status === 'pending')
    return 'loading'
  return 'notFound'
})

// ─── People ─────────────────────────────────────────────────────────────────
const addresses = computed(() =>
  chain.value
    ? [chain.value.source.address, chain.value.via.address, chain.value.target.address]
    : []
)
const people = usePeople(addresses)
const accounts = [0, 1, 2].map((i) => useAccount(() => addresses.value[i]))
const name = (address: string) => people.value.get(address)?.name || t('exchanges.someone')
const role = computed(() => (chain.value ? viewerRole(chain.value, session.address) : null))
const me = computed(() => session.address)

const ratingFormat = computed(
  () => new Intl.NumberFormat(locale.value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
)

const steps = computed(() => {
  const c = chain.value
  if (!c) return []
  const all = chainSteps(c)
  return all.map((s, i) => {
    const received = all[(i + 2) % 3]!.offer
    const account = accounts[i]!.data.value
    const you = s.giver === me.value
    return {
      ...s,
      you,
      photo: offerCardData(s.offer, context.value).photo,
      price: offerCardData(s.offer, context.value).price,
      active: isOfferActive(s.offer),
      label: you
        ? t('exchanges.youGive')
        : s.receiver === me.value
          ? t('exchanges.givesYou', { name: name(s.giver) })
          : t('exchanges.gives', { name: name(s.giver) }),
      person: you ? t('exchanges.you') : name(s.giver),
      avatar: people.value.get(s.giver)?.avatar ?? null,
      wants: [
        !you && account?.ratingCount ? ratingFormat.value.format(account.rating) : null,
        you
          ? t('exchanges.chain.youWant', { title: received.caption })
          : t('exchanges.chain.wants', { title: received.caption }),
      ]
        .filter(Boolean)
        .join(' · '),
    }
  })
})

const closing = computed(() => {
  const c = chain.value
  if (!c) return ''
  return c.source.address === me.value
    ? t('exchanges.chain.closedYou', { title: c.target.caption })
    : t('exchanges.chain.closed', { title: c.target.caption, name: name(c.source.address) })
})

/** What I give and get, for a participant. */
const mySide = computed(() => {
  const all = steps.value
  const give = all.find((s) => s.giver === me.value)
  const get = all.find((s) => s.receiver === me.value)
  if (!give || !get) return null
  const pk = (o: typeof give.offer) => offerPkoin(o, rates.data.value ?? null)
  const gap = priceGap(pk(give.offer), pk(get.offer))
  const amount = (n: number) => `${formatPkoin(n, locale.value)} PKOIN`
  return {
    give,
    get,
    gap: !gap
      ? null
      : gap.kind === 'equal'
        ? t('exchanges.chain.equal')
        : t(`exchanges.chain.${gap.kind}`, { amount: amount(gap.pkoin) }),
  }
})
/** As PriceTag says it, in a line of text. */
function priceText(s: (typeof steps.value)[number]) {
  if (s.price.free) return t('price.free')
  if (s.price.pkoin == null) return ''
  const amount = `${formatPkoin(s.price.pkoin, locale.value)} PKOIN`
  return s.price.from ? t('price.from', { amount }) : amount
}

const crumbs = computed(() => [
  ...(mine.value
    ? [{ label: t('cabinet.sections.barters'), to: cabinetRoute(me.value, 'barters') }]
    : []),
  ...(source.value
    ? [
        {
          label: source.value.caption,
          to: mine.value
            ? optionsRoute(source.value.hash ?? '')
            : offerRoute(source.value.hash ?? ''),
        },
      ]
    : []),
  { label: t('exchanges.chain.crumb') },
])
const backTo = computed(() =>
  source.value?.hash
    ? mine.value
      ? optionsRoute(source.value.hash)
      : offerRoute(source.value.hash)
    : { name: 'home' }
)

// ─── «Предложить обмен»: the group chat ─────────────────────────────────────
const confirmOpen = ref(false)
const canPropose = computed(() => role.value === 'source' && !problem.value)

/** As the old ThreeSidedSearch: «Групповой обмен» with the other two and a link to the chain. */
async function propose() {
  const c = chain.value
  const sdk = session.sdk
  if (!c || !sdk) return
  const ok = await chat.open({
    name: t('exchanges.roomName'),
    members: [c.via.address, c.target.address],
    messages: [sdk.get.applink(chainPath(chainRefOf(c)))],
  })
  if (ok) confirmOpen.value = false
}
</script>

<template>
  <AppLayout tab="exchanges">
    <template #mobile-top>
      <PageTopBar :title="t('exchanges.chain.title')" :back="backTo" />
    </template>

    <div class="ch container" data-testid="chain-page" :data-state="page" :data-role="role ?? ''">
      <div v-if="page === 'loading'" class="ch__loading" aria-busy="true">
        <UiSkeleton width="30%" height="14px" />
        <UiSkeleton width="50%" height="32px" />
        <UiSkeleton height="360px" radius="24px" />
      </div>

      <div
        v-else-if="page !== 'ready' && page !== 'broken'"
        class="ch__missing"
        data-testid="chain-missing"
      >
        <UiEmptyState
          icon="search-empty"
          :title="t('exchanges.chain.title')"
          :text="
            page === 'bad'
              ? t('exchanges.chain.badLink')
              : page === 'error'
                ? t('item.missing.errorText')
                : t('exchanges.chain.notFound')
          "
        />
        <div class="ch__actions">
          <UiButton v-if="page === 'error'" variant="neutral" @click="offers.refetch()">{{
            t('item.missing.refresh')
          }}</UiButton>
          <UiButton v-if="source?.hash && mine" :to="optionsRoute(source.hash)">{{
            t('exchanges.chain.otherVariants')
          }}</UiButton>
          <UiButton v-else :to="{ name: 'home' }">{{ t('item.missing.home') }}</UiButton>
        </div>
      </div>

      <template v-else>
        <UiBreadcrumbs class="ch__crumbs" :items="crumbs" />
        <div class="ch__head">
          <h1 class="ch__title">{{ t('exchanges.chain.title') }}</h1>
          <p class="ch__sub">{{ t('exchanges.chain.subtitle') }}</p>
        </div>

        <UiAlert v-if="problem" tone="warning" data-testid="chain-broken">
          {{
            problem.kind === 'inactive'
              ? t('exchanges.chain.inactive', { title: problem.offer.caption })
              : t('exchanges.chain.missing')
          }}
          <template v-if="source?.hash && mine" #action>
            <UiButton variant="neutral" :size="36" :to="optionsRoute(source.hash)">{{
              t('exchanges.chain.otherVariants')
            }}</UiButton>
          </template>
        </UiAlert>

        <div v-if="chain" class="ch__layout">
          <section class="ch__main">
            <ol class="ch__flow">
              <template v-for="(s, i) in steps" :key="s.role">
                <li
                  class="ch__step"
                  :class="{ 'ch__step--you': s.you, 'ch__step--off': !s.active }"
                >
                  <span class="ch__label">{{ s.label }}</span>
                  <RouterLink
                    class="ch__photo"
                    :to="offerRoute(s.offer.hash ?? '')"
                    tabindex="-1"
                    aria-hidden="true"
                  >
                    <OfferPhoto :src="s.photo" ratio="4 / 3" radius="12px" :inactive="!s.active" />
                  </RouterLink>
                  <div class="ch__info">
                    <RouterLink class="ch__item" :to="offerRoute(s.offer.hash ?? '')">{{
                      s.offer.caption
                    }}</RouterLink>
                    <span class="ch__price">{{ priceText(s) }}</span>
                  </div>
                  <div class="ch__person">
                    <UiAvatar :size="32" :name="name(s.giver)" :src="s.avatar" :seed="s.giver" />
                    <span class="ch__person-text">
                      <span class="ch__person-name">{{ s.person }}</span>
                      <span class="ch__person-wants">{{ s.wants }}</span>
                    </span>
                  </div>
                </li>
                <li class="ch__arrow" aria-hidden="true">
                  <UiIcon
                    :name="i < steps.length - 1 ? 'arrow-right' : 'exchange'"
                    :size="28"
                    :stroke="2"
                  />
                </li>
              </template>
            </ol>

            <div class="ch__closed">
              <UiIcon name="exchange" :size="22" :stroke="2" />
              <span>{{ closing }}</span>
            </div>

            <dl v-if="mySide" class="ch__sides" data-testid="chain-my-side">
              <div class="ch__side">
                <dt>{{ t('exchanges.youGive') }}</dt>
                <dd>{{ mySide.give.offer.caption }} · {{ priceText(mySide.give) }}</dd>
              </div>
              <div class="ch__side">
                <dt>{{ t('exchanges.youGet') }}</dt>
                <dd>{{ mySide.get.offer.caption }} · {{ priceText(mySide.get) }}</dd>
              </div>
              <div v-if="mySide.gap" class="ch__side ch__side--gap">
                <dt>{{ t('exchanges.chain.gap') }}</dt>
                <dd>{{ mySide.gap }}</dd>
              </div>
            </dl>
          </section>

          <aside class="ch__aside">
            <div class="ch__card">
              <span class="ch__card-title">{{ t('exchanges.chain.how') }}</span>
              <ol class="ch__how">
                <li>
                  <span class="ch__num ch__num--on">1</span>
                  {{ t('exchanges.chain.step1', { room: t('exchanges.roomName') }) }}
                </li>
                <li><span class="ch__num">2</span>{{ t('exchanges.chain.step2') }}</li>
                <li><span class="ch__num">3</span>{{ t('exchanges.chain.step3') }}</li>
              </ol>
              <UiButton
                v-if="canPropose"
                class="ch__propose"
                :size="52"
                block
                external
                :disabled="chat.opening.value"
                data-testid="chain-propose"
                @click="confirmOpen = true"
                >{{ t('exchanges.chain.propose') }}</UiButton
              >
              <UiAlert
                v-else-if="role && role !== 'source'"
                tone="info"
                data-testid="chain-participant"
                >{{
                  t('exchanges.chain.participant', { name: name(chain.source.address) })
                }}</UiAlert
              >
              <UiAlert v-else-if="!role" tone="info">{{ t('exchanges.chain.outsider') }}</UiAlert>
              <UiAlert tone="info" icon="info" class="ch__note">{{
                t('exchanges.chain.note')
              }}</UiAlert>
            </div>

            <div v-if="mine" class="ch__card ch__card--small" data-testid="chain-others">
              <span class="ch__card-title">{{
                t('exchanges.chain.others', { title: chain.source.caption })
              }}</span>
              <ul v-if="others.length" class="ch__others">
                <li v-for="c in others" :key="`${c.target.hash}:${c.via.hash}`">
                  <RouterLink :to="chainRoute(c)"
                    >{{ c.via.caption }} → {{ c.target.caption }}</RouterLink
                  >
                </li>
              </ul>
              <span v-else-if="matches.state.value?.status === 'ready'" class="ch__muted">{{
                t('exchanges.chain.othersNone')
              }}</span>
            </div>
          </aside>
        </div>
      </template>
    </div>

    <div v-if="chain && canPropose" class="ch__bar">
      <UiButton
        :size="52"
        block
        external
        :disabled="chat.opening.value"
        data-testid="chain-propose-bar"
        @click="confirmOpen = true"
        >{{ t('exchanges.chain.propose') }}</UiButton
      >
    </div>

    <ProposeDialog
      v-model:open="confirmOpen"
      :chain="chain"
      :people="people"
      :sending="chat.opening.value"
      @confirm="propose"
    />
  </AppLayout>
</template>

<style scoped>
.ch {
  padding-top: 20px;
  padding-bottom: 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ch__loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ch__missing {
  max-width: 520px;
  margin: 48px auto;
  padding: 32px 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.ch__actions {
  display: flex;
  gap: 8px;
}

.ch__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ch__title {
  font-size: 30px;
  line-height: 38px;
  font-weight: 700;
}

.ch__sub {
  font-size: 16px;
  line-height: 22px;
  color: var(--text2);
}

.ch__layout {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 24px;
}

.ch__main {
  flex: 999 1 640px;
  min-width: 0;
  padding: 28px;
  border-radius: 24px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ch__flow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 36px minmax(0, 1fr) 36px minmax(0, 1fr) 0;
  align-items: center;
  gap: 8px;
}

/* The last arrow is the circle closing; on a computer the banner below says it. */
.ch__flow > .ch__arrow:last-child {
  display: none;
}

.ch__step {
  min-width: 0;
  padding: 12px;
  border-radius: 18px;
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ch__step--you {
  background: var(--primary-soft);
  box-shadow: 0 0 0 2px var(--primary);
}

.ch__step--off {
  opacity: 0.6;
}

.ch__label {
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text3);
}

.ch__step--you .ch__label {
  color: var(--link);
}

.ch__photo {
  display: block;
}

.ch__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ch__item {
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.ch__item:hover {
  color: var(--link);
}

.ch__price {
  font-size: 14px;
  color: var(--text2);
}

.ch__person {
  padding-top: 8px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
}

.ch__person-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ch__person-name {
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ch__person-wants {
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ch__arrow {
  display: flex;
  justify-content: center;
  color: var(--link);
}

.ch__closed {
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--primary-soft);
  color: var(--link);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.ch__closed .ui-icon {
  flex: none;
}

.ch__sides {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 12px;
}

.ch__side {
  padding: 14px;
  border-radius: 14px;
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ch__side dt {
  font-size: 13px;
  color: var(--text3);
}

.ch__side dd {
  margin: 0;
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
}

.ch__side--gap {
  background: var(--warning-soft);
}

.ch__side--gap dt {
  color: var(--text2);
}

.ch__aside {
  flex: 1 1 320px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ch__card {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ch__card--small {
  padding: 20px;
  gap: 10px;
}

.ch__card-title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.ch__card--small .ch__card-title {
  font-size: 15px;
  line-height: 20px;
}

.ch__how {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ch__how li {
  display: flex;
  gap: 12px;
  font-size: 14px;
  line-height: 20px;
}

.ch__num {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.ch__num--on {
  background: var(--primary);
  color: #ffffff;
}

.ch__others {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
}

.ch__muted {
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.ch__bar {
  display: none;
}

@media (max-width: 1023px) {
  .ch__aside {
    max-width: none;
  }
}

@media (max-width: 767px) {
  .ch {
    padding-top: 16px;
    padding-bottom: 24px;
    gap: 12px;
  }

  .ch__crumbs,
  .ch__head {
    display: none;
  }

  .ch__main {
    padding: 0;
    background: none;
    gap: 12px;
  }

  .ch__flow {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }

  .ch__flow > .ch__arrow:last-child {
    display: none;
  }

  .ch__step {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    grid-template-areas: 'photo label' 'photo info';
    column-gap: 12px;
    row-gap: 2px;
    align-items: start;
    background: var(--surface);
  }

  .ch__label {
    grid-area: label;
    font-size: 11px;
  }

  .ch__photo {
    grid-area: photo;
  }

  .ch__info {
    grid-area: info;
    gap: 2px;
  }

  .ch__person {
    display: none;
  }

  .ch__arrow :deep(svg) {
    transform: rotate(90deg);
  }

  .ch__closed {
    justify-content: center;
    text-align: center;
  }

  .ch__aside {
    flex-basis: 100%;
  }

  .ch__card {
    padding: 16px;
  }

  .ch__propose {
    display: none;
  }

  .ch__bar {
    position: sticky;
    bottom: 64px;
    z-index: 5;
    display: block;
    padding: 12px 16px;
    background: var(--surface);
    border-top: 1px solid var(--border);
  }
}
</style>
