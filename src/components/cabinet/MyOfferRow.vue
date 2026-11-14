<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/item/ConfirmDialog.vue'
import MenuList, { type MenuItem } from '@/components/layout/MenuList.vue'
import NetStatusBadge from '@/components/net/NetStatusBadge.vue'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import type { MyOfferItem } from '@/composables/cabinet-data'
import { useOfferActions } from '@/composables/offer-actions'
import { forgetSentDraft } from '@/composables/cabinet'
import { formatDate } from '@/lib/format'
import { offerLifecycle } from '@/models/offer'
import { dueForRenewal, useAutorenewStore } from '@/stores/autorenew'
import { useSessionStore } from '@/stores/session'
import { netStatusOf, useTxStore } from '@/stores/tx'
import { showToast } from '@/ui/toast'
import UiBadge, { type BadgeTone } from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'
import UiPopover from '@/ui/UiPopover.vue'

const DAY = 24 * 60 * 60 * 1000

/** One of my offers in the cabinet (s5-myoffers-desktop / -mobile). */
const props = defineProps<{
  item: MyOfferItem
  /** Exchanges found for it (stage 7); `null` while they are looked for. */
  variants?: number | null
}>()
const { t, locale } = useI18n()
const router = useRouter()
const tx = useTxStore()
const session = useSessionStore()
const autorenew = useAutorenewStore()
const cardCtx = useCardContext()

const offer = computed(() => props.item.offer)
const actions = useOfferActions(offer)
const card = computed(() => offerCardData(offer.value, cardCtx.value))
const id = computed(() => offer.value.hash ?? '')
const lifecycle = computed(() => offerLifecycle(offer.value))
const due = computed(() => lifecycle.value === 'active' && dueForRenewal(offer.value))
/** A new offer on its way, or refused. */
const newTx = computed(() => props.item.tx ?? null)
const op = computed(() => actions.operation.value)
const busy = computed(() => actions.busy.value || newTx.value?.status === 'sending')

const date = (ms: number) => formatDate(ms, locale.value)

const status = computed<{ tone: BadgeTone; label: string; note?: string }>(() => {
  const o = offer.value
  if (newTx.value)
    return newTx.value.status === 'failed'
      ? { tone: 'danger', label: t('myOffers.status.failed') }
      : { tone: 'warning', label: t('myOffers.status.publishing') }
  if (lifecycle.value === 'withdrawn')
    return {
      tone: 'neutral',
      label: t('myOffers.status.withdrawn'),
      note: t('myOffers.withdrawnOn', { date: date(o.time) }),
    }
  if (lifecycle.value === 'expired')
    return {
      tone: 'danger',
      label: t('myOffers.status.expired'),
      note: t('myOffers.till', { date: date(o.till) }),
    }
  const notes = [t('myOffers.till', { date: date(o.till) })]
  if (autorenew.isOn(o.hash)) notes.push(t('myOffers.autorenew'))
  if (due.value) {
    const days = Math.ceil((o.till - Date.now()) / DAY)
    return {
      tone: 'warning',
      label: days <= 0 ? t('myOffers.status.expiresToday') : t('myOffers.status.expiresIn', days),
      note: notes.join(' · '),
    }
  }
  return { tone: 'success', label: t('myOffers.status.online'), note: notes.join(' · ') }
})

/** A transaction about this offer is on its way or refused: its status instead of the badge. */
const opStatus = computed(() => {
  const o = op.value
  if (!o || o.kind === 'failed') return null
  return netStatusOf(o.tx)
})
const opFailed = computed(() => (op.value?.kind === 'failed' ? op.value : null))

const to = computed(() =>
  offer.value.hash && !newTx.value ? { name: 'barterItem', params: { id: id.value } } : undefined
)
const editTo = computed(() => ({ name: 'createBarter', params: { id: id.value } }))
const exchangeTo = computed(() => ({
  name: 'exchangeOptions',
  params: { id: id.value },
  query: { expanded: '1' },
}))

// ─── Actions ────────────────────────────────────────────────────────────────
type Confirm = 'withdraw' | 'renew' | 'remove'
const confirm = ref<Confirm | null>(null)
const confirmOpen = computed({
  get: () => confirm.value !== null,
  set: (value) => {
    if (!value) confirm.value = null
  },
})

function ask(action: Confirm) {
  if (action === 'renew' && !actions.canRenew.value) {
    showToast(t('item.own.renewCategory'), { kind: 'error' })
    return
  }
  confirm.value = action
}

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

const moreBtn = ref<InstanceType<typeof UiButton>>()
const moreEl = computed(() => (moreBtn.value?.$el as HTMLElement | undefined) ?? null)
const moreOpen = ref(false)
const menu = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [{ key: 'open', label: t('myOffers.actions.open') }]
  if (lifecycle.value === 'active') {
    if (!due.value) items.push({ key: 'renew', label: t('myOffers.actions.renew') })
    items.push({ key: 'withdraw', label: t('myOffers.actions.withdraw') })
  }
  items.push({ key: 'remove', label: t('myOffers.actions.remove'), divider: true })
  return items
})

function onMenu(key: string) {
  moreOpen.value = false
  if (key === 'open') void router.push(to.value ?? editTo.value)
  else ask(key as Confirm)
}

async function retryNew() {
  const refused = newTx.value
  if (!refused) return
  const sent = await tx.retry(refused.id)
  if (sent && sent.status !== 'failed') forgetSentDraft(session.address, refused.payload)
}
</script>

<template>
  <article
    class="mo"
    :class="{ 'mo--inactive': lifecycle !== 'active' && !newTx }"
    data-testid="my-offer"
    :data-id="id"
  >
    <component
      :is="to ? 'RouterLink' : 'div'"
      :to="to"
      class="mo__photo"
      tabindex="-1"
      aria-hidden="true"
    >
      <OfferPhoto :src="card.photo" radius="12px" :inactive="lifecycle !== 'active' && !newTx" />
    </component>
    <div class="mo__body">
      <RouterLink v-if="to" :to="to" class="mo__title">{{ offer.caption }}</RouterLink>
      <span v-else class="mo__title mo__title--plain">{{ offer.caption }}</span>
      <PriceTag class="mo__price" :price="card.price" :size="16" no-equivalent />
      <div class="mo__status">
        <NetStatusBadge v-if="opStatus" :status="opStatus" />
        <template v-else>
          <UiBadge :tone="opFailed ? 'danger' : status.tone" dot data-testid="my-offer-status">{{
            opFailed ? t('myOffers.status.actionFailed') : status.label
          }}</UiBadge>
          <span v-if="status.note && !opFailed" class="mo__note">{{ status.note }}</span>
        </template>
      </div>
      <RouterLink
        v-if="variants && lifecycle === 'active' && !newTx"
        class="mo__variants"
        :to="exchangeTo"
        data-testid="my-offer-variants"
        >{{ t('myOffers.variants', variants) }}</RouterLink
      >
    </div>
    <UiButton
      v-if="!newTx"
      ref="moreBtn"
      class="mo__more"
      variant="neutral"
      :size="36"
      icon="more"
      :label="t('myOffers.actions.more')"
      :disabled="busy"
      data-testid="my-offer-more"
      @click="moreOpen = !moreOpen"
    />
    <div class="mo__actions">
      <template v-if="newTx">
        <UiButton v-if="newTx.status === 'failed'" :size="36" @click="retryNew">{{
          t('myOffers.actions.retry')
        }}</UiButton>
      </template>
      <template v-else>
        <UiButton
          v-if="opFailed"
          :size="36"
          data-testid="my-offer-retry"
          @click="actions.retry()"
          >{{ t('myOffers.actions.retry') }}</UiButton
        >
        <UiButton
          v-else-if="lifecycle !== 'active'"
          :size="36"
          :disabled="busy"
          data-testid="my-offer-renew"
          @click="ask('renew')"
          >{{ t('myOffers.actions.republish') }}</UiButton
        >
        <UiButton
          v-else-if="due"
          :size="36"
          :disabled="busy"
          data-testid="my-offer-renew"
          @click="ask('renew')"
          >{{ t('myOffers.actions.renew') }}</UiButton
        >
        <UiButton v-else variant="secondary" :size="36" :to="exchangeTo" :disabled="busy">{{
          t('myOffers.actions.findExchanges')
        }}</UiButton>
        <UiButton variant="neutral" :size="36" :to="editTo" :disabled="busy">{{
          t('myOffers.actions.edit')
        }}</UiButton>
      </template>
    </div>

    <UiPopover
      v-model:open="moreOpen"
      :anchor="moreEl"
      align="end"
      :width="260"
      :label="t('myOffers.actions.more')"
    >
      <MenuList :items="menu" @select="onMenu" />
    </UiPopover>

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="confirm ? t(`item.confirm.${confirm}Title`) : ''"
      :text="confirm ? t(`item.confirm.${confirm}Text`, { title: offer.caption }) : ''"
      :confirm="confirm ? t(`item.confirm.${confirm}`) : ''"
      :danger="confirm === 'remove' || confirm === 'withdraw'"
      @confirm="run"
    />
  </article>
</template>

<style scoped>
.mo {
  padding: 14px;
  border-radius: var(--radius-l);
  background: var(--surface);
  display: grid;
  grid-template-columns: 144px minmax(0, 1fr) auto;
  grid-template-areas:
    'photo body more'
    'photo body actions';
  column-gap: 16px;
  row-gap: 10px;
}

.mo__photo {
  grid-area: photo;
  display: block;
  align-self: start;
}

.mo__body {
  grid-area: body;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mo__title {
  font-size: 16px;
  line-height: 21px;
  font-weight: 500;
  color: var(--link);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.mo__title--plain {
  color: var(--text);
}

.mo--inactive .mo__title {
  color: var(--text2);
}

.mo__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.mo__more {
  grid-area: more;
  justify-self: end;
}

.mo__variants {
  align-self: flex-start;
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: var(--link);
}

.mo__actions {
  grid-area: actions;
  align-self: end;
  justify-self: end;
  display: flex;
  gap: 6px;
}

/* On a computer «…» stands last in the row of buttons. */
@media (min-width: 768px) {
  .mo {
    grid-template-areas: 'photo body actions';
    grid-template-columns: 144px minmax(0, 1fr) auto;
  }

  .mo__actions {
    padding-right: 42px;
  }

  .mo__more {
    grid-area: actions;
    align-self: end;
  }
}

@media (max-width: 767px) {
  .mo {
    grid-template-columns: 96px minmax(0, 1fr) auto;
    grid-template-areas:
      'photo body more'
      'actions actions actions';
    column-gap: 12px;
    padding: 12px;
  }

  .mo__more {
    align-self: start;
  }

  .mo__actions {
    justify-self: stretch;
  }

  .mo__actions > :deep(*) {
    flex: 1 1 0;
  }
}
</style>
