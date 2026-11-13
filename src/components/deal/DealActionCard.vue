<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TransferFailure, TransferRequest } from '@/composables/safe-deal'
import { formatAgo, formatPkoin, shortHash } from '@/lib/format'
import { txErrorText } from '@/lib/tx-errors'
import {
  isDealTurn,
  moneyFromPayment,
  moneyFromValue,
  roundPkoin,
  type DealRole,
  type DealState,
  type FeeVariant,
} from '@/models/safe-deal'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiCheckbox from '@/ui/UiCheckbox.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiInput from '@/ui/UiInput.vue'
import UiSegmented from '@/ui/UiSegmented.vue'
import DealCalc, { type CalcRow } from './DealCalc.vue'
import DealSteps from './DealSteps.vue'
import TransferDialog from './TransferDialog.vue'

/**
 * «Выполните действия» of the deal page (s7-dealmatrix, s7-dealbuyer,
 * s7-dealvalidator, s7-dealstates): what my role does at this status. Only
 * the one whose move it is gets a button with the exact amount; the rest
 * wait and talk in the chat. Money goes only from here: the buyer to the
 * guarantor at 1, the guarantor to the seller or back to the buyer at 2.
 */
const props = defineProps<{
  role: DealRole
  state: DealState
  feePercent: number
  variant: FeeVariant
  /** The offer's price, PKOIN: the starting price of the deal. */
  listed: number | null
  /** My transfer, sent but not in the chain yet. */
  sending: { txid: string | null; at: number } | null
  /** Sent from this page just now. */
  justSent?: boolean
  failure?: { kind: TransferFailure; text: string } | null
  /** The wallet is open. */
  busy?: boolean
  /** The status is not confirmed (the last refresh failed): no transfers. */
  stale?: boolean
  /** The seller is on the ban list: the buyer does not pay, the guarantor is warned. */
  sellerBanned?: boolean
  refreshing?: boolean
  names: Record<DealRole, string>
  send: (request: Omit<TransferRequest, 'status'> & { to: string }) => Promise<boolean>
  addresses: Record<DealRole, string>
}>()
const emit = defineEmits<{ refresh: [] }>()
const { t, locale } = useI18n()
const id = useId()

const status = computed(() => props.state.status)
const turn = computed(() => isDealTurn(props.role, status.value))
const pk = (value: number) => formatPkoin(value, locale.value)
const pct = (value: number) =>
  new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value)

type Mode = 'sent' | 'pay' | 'banned' | 'paying' | 'decide' | 'wait' | 'transit' | 'result'
const mode = computed<Mode>(() => {
  if (props.sending) return 'sent'
  switch (status.value) {
    case '1':
      if (props.state.paying) return 'paying'
      if (props.role !== 'buyer') return 'wait'
      return props.sellerBanned ? 'banned' : 'pay'
    case '2':
      return props.role === 'validator' ? 'decide' : 'wait'
    case '3a':
    case '3b':
      return 'transit'
    default:
      return 'result'
  }
})

const eyebrow = computed(() => {
  if (mode.value === 'pay' || mode.value === 'decide') return t('deal.eyebrow.turn')
  if (mode.value === 'result')
    return turn.value ? t('deal.eyebrow.confirm') : t('deal.eyebrow.result')
  if (status.value === '2' && props.role === 'seller') return t('deal.eyebrow.turnChat')
  return t('deal.eyebrow.wait')
})

const heading = computed(() => {
  switch (mode.value) {
    case 'sent':
      return t('deal.heading.sent')
    case 'pay':
      return t('deal.heading.pay')
    case 'banned':
      return t('deal.heading.banned')
    case 'decide':
      return t('deal.heading.decide')
    case 'transit':
      return t('deal.heading.transit')
    case 'result':
      return t(`deal.status.s${status.value}`)
    default:
      return t('deal.heading.steps')
  }
})

const STEPS: Record<string, Partial<Record<DealRole, string[]>>> = {
  '1': {
    buyer: ['s1Buyer1', 's1Buyer2'],
    seller: ['s1Seller1', 's1Seller2'],
    validator: ['s1Validator1', 's1Validator2', 's1Validator3'],
  },
  '2': {
    buyer: ['s2Buyer1', 's2Buyer2', 's2Buyer3'],
    seller: ['s2Seller1', 's2Seller2'],
    validator: ['s2Validator1', 's2Validator2', 's2Validator3'],
  },
  '3a': { buyer: ['s3Wait'], seller: ['s3Wait'], validator: ['s3Validator'] },
  '3b': { buyer: ['s3Wait'], seller: ['s3Wait'], validator: ['s3Validator'] },
  '4a': { seller: ['s4aSeller'], validator: ['s4aValidator'] },
  '4b': { buyer: ['s4bBuyer'], validator: ['s4bValidator'] },
}
const steps = computed(() => {
  if (mode.value === 'banned') return []
  const keys = mode.value === 'sent' ? ['sent'] : (STEPS[status.value]?.[props.role] ?? [])
  return keys.map((k) => t(`deal.step.${k}`))
})

// ─── The buyer pays the guarantor ───────────────────────────────────────────
const value = ref(props.listed ? String(props.listed) : '')
watch(
  () => props.listed,
  (listed) => {
    if (!value.value && listed) value.value = String(listed)
  }
)
const valueNum = computed(() => Number(String(value.value).replace(',', '.').replace(/\s/g, '')))
const valueOk = computed(() => Number.isFinite(valueNum.value) && valueNum.value > 0)
const confirmed = ref(false)
const buyerMoney = computed(() =>
  valueOk.value ? moneyFromValue(valueNum.value, props.feePercent, props.variant) : null
)
const who = computed(() => t(`deal.form.who.${props.variant}`))

// ─── The guarantor decides ──────────────────────────────────────────────────
const verdict = ref<'yes' | 'no'>('yes')
const verdicts = computed(() => [
  { value: 'yes' as const, label: t('deal.form.yes') },
  { value: 'no' as const, label: t('deal.form.no') },
])
const paidMoney = computed(() =>
  moneyFromPayment(props.state.paid, props.feePercent, props.variant)
)

const calcRows = computed<CalcRow[]>(() => {
  const money = mode.value === 'pay' ? buyerMoney.value : paidMoney.value
  if (mode.value === 'pay') {
    return money
      ? [
          { label: t('deal.form.calcValue'), value: `${pk(money.value)} PKOIN` },
          {
            label: t('deal.form.calcFee', { fee: pct(props.feePercent) }),
            value: `${pk(money.fee)} PKOIN`,
          },
          { label: t('deal.form.calcWho'), value: who.value },
          { label: t('deal.form.calcPayment'), value: `${pk(money.payment)} PKOIN`, total: true },
        ]
      : []
  }
  if (verdict.value === 'no') {
    return [
      { label: t('deal.form.calcPaid'), value: `${pk(props.state.paid)} PKOIN` },
      { label: t('deal.form.calcRefund'), value: `${pk(props.state.paid)} PKOIN`, total: true },
    ]
  }
  const m = paidMoney.value
  return [
    { label: t('deal.form.calcValue'), value: `${pk(m.value)} PKOIN` },
    { label: t('deal.form.calcFee', { fee: pct(props.feePercent) }), value: `${pk(m.fee)} PKOIN` },
    { label: t('deal.form.calcWho'), value: who.value },
    { label: t('deal.form.calcPaid'), value: `${pk(props.state.paid)} PKOIN` },
    { label: t('deal.form.calcToSeller'), value: `${pk(m.toSeller)} PKOIN`, total: true },
  ]
})

/** What the button sends now. */
const transfer = computed(() => {
  if (mode.value === 'pay' && buyerMoney.value) {
    return {
      to: 'validator' as DealRole,
      amount: buyerMoney.value.payment,
      feemode: 'exclude' as const,
      label: t('deal.form.pay', { amount: pk(buyerMoney.value.payment) }),
      title: t('deal.transfer.titlePay'),
    }
  }
  if (mode.value === 'decide') {
    return verdict.value === 'yes'
      ? {
          to: 'seller' as DealRole,
          amount: paidMoney.value.toSeller,
          feemode: 'exclude' as const,
          label: t('deal.form.payout', { amount: pk(paidMoney.value.toSeller) }),
          title: t('deal.transfer.titlePayout'),
        }
      : {
          to: 'buyer' as DealRole,
          // The whole payment back; the network fee comes out of it, as before.
          amount: props.state.paid,
          feemode: 'include' as const,
          label: t('deal.form.refund', { amount: pk(props.state.paid) }),
          title: t('deal.transfer.titleRefund'),
        }
  }
  return null
})
const canSend = computed(
  () =>
    !!transfer.value && transfer.value.amount > 0 && confirmed.value && !props.busy && !props.stale
)

const dialogOpen = ref(false)
async function confirmTransfer() {
  const tr = transfer.value
  // The status may have moved or gone stale while the window was open.
  if (!tr || !canSend.value) return
  await props.send({ to: props.addresses[tr.to], amount: tr.amount, feemode: tr.feemode })
  dialogOpen.value = false
  confirmed.value = false
}

// ─── Notes ──────────────────────────────────────────────────────────────────
const feeKept = computed(() => {
  const out = props.state.transfer?.amount ?? 0
  return roundPkoin(Math.max(0, props.state.paid - out))
})
const sentLine = computed(() => {
  const s = props.sending
  if (!s) return ''
  const ago = formatAgo(s.at, locale.value)
  return s.txid ? t('deal.sent.tx', { hash: shortHash(s.txid), ago }) : ''
})
const failureTitle = computed(() =>
  props.failure ? t(`deal.failed.${props.failure.kind}Title`) : ''
)
const failureText = computed(() => {
  const f = props.failure
  if (!f) return ''
  return f.kind === 'other'
    ? t('deal.failed.otherText', { error: txErrorText(f.text, t) })
    : t(`deal.failed.${f.kind}Text`)
})
</script>

<template>
  <section
    class="dac"
    :class="{ 'dac--turn': turn && !sending && mode !== 'banned' }"
    data-testid="deal-action"
    :data-mode="mode"
  >
    <p class="dac__eyebrow">{{ eyebrow }}</p>
    <h2 class="dac__title">{{ heading }}</h2>

    <DealSteps v-if="steps.length" :steps="steps" />

    <!-- My transfer has gone: waiting for the block (s7-dealstates). -->
    <template v-if="mode === 'sent'">
      <UiAlert v-if="justSent" tone="success" live data-testid="deal-sent">{{
        t('deal.sent.title')
      }}</UiAlert>
      <ul class="dac__progress">
        <li class="dac__progress-item dac__progress-item--done">
          <UiIcon name="check" :size="14" :stroke="3" />{{ t('deal.sent.node') }}
        </li>
        <li class="dac__progress-item dac__progress-item--now">
          <span class="dac__ring" />{{ t('deal.sent.block') }}
        </li>
        <li class="dac__progress-item"><span class="dac__ring" />{{ t('deal.sent.updated') }}</li>
      </ul>
      <UiAlert tone="info">{{ t('deal.note.txSent') }}</UiAlert>
      <p v-if="sentLine" class="dac__tx">{{ sentLine }}</p>
      <UiAlert v-if="role === 'validator'" tone="warning">{{ t('deal.note.retryLocked') }}</UiAlert>
    </template>

    <UiAlert v-if="mode === 'banned'" tone="danger" data-testid="deal-seller-banned">{{
      t('deal.note.sellerBanned')
    }}</UiAlert>

    <UiAlert v-if="mode === 'paying'" tone="info" live data-testid="deal-paying">{{
      role === 'buyer' ? t('deal.note.payingMine') : t('deal.note.paying')
    }}</UiAlert>

    <template v-if="mode === 'transit'">
      <UiAlert v-if="role === 'validator'" tone="warning">{{ t('deal.note.retryLocked') }}</UiAlert>
      <UiAlert v-else tone="info">{{ t('deal.note.txSent') }}</UiAlert>
    </template>

    <template v-if="mode === 'result'">
      <template v-if="status === '4a'">
        <UiAlert v-if="role === 'buyer'" tone="success">{{ t('deal.note.done') }}</UiAlert>
        <UiAlert v-if="role === 'buyer'" tone="info">{{ t('deal.note.rate') }}</UiAlert>
        <UiAlert v-if="role === 'validator' && feeKept > 0" tone="success">{{
          t('deal.note.feeKept', { fee: pk(feeKept) })
        }}</UiAlert>
      </template>
      <template v-else>
        <UiAlert v-if="role === 'buyer'" tone="danger">{{ t('deal.note.refundedYou') }}</UiAlert>
        <UiAlert v-if="role === 'seller'" tone="danger">{{ t('deal.note.refunded') }}</UiAlert>
      </template>
      <slot name="result" />
    </template>

    <!-- The buyer: the final price and the payment to the guarantor. -->
    <template v-if="mode === 'pay'">
      <div class="dac__field">
        <label class="dac__label" :for="`dac-${id}`">{{ t('deal.form.value') }}</label>
        <UiInput
          :id="`dac-${id}`"
          v-model="value"
          class="dac__input"
          inputmode="decimal"
          suffix="PKOIN"
          :invalid="!valueOk"
          data-testid="deal-value"
        />
        <p v-if="!valueOk" class="dac__error" role="alert">{{ t('deal.form.valueError') }}</p>
        <p v-else-if="listed" class="dac__hint">
          {{ t('deal.form.listed', { price: pk(listed) }) }}
        </p>
      </div>
      <DealCalc v-if="calcRows.length" :rows="calcRows" />
    </template>

    <!-- The guarantor: pay the seller or give the money back. -->
    <template v-if="mode === 'decide'">
      <UiAlert v-if="sellerBanned" tone="danger" data-testid="deal-seller-banned">{{
        t('deal.note.sellerBannedValidator')
      }}</UiAlert>
      <UiAlert v-if="state.paying" tone="warning" live data-testid="deal-paying-more">{{
        t('deal.note.payingMore', { amount: pk(state.paying.amount) })
      }}</UiAlert>
      <div class="dac__rules">
        <h3>{{ t('deal.form.rules') }}</h3>
        <ul>
          <li>{{ t('deal.form.rule1') }}</li>
          <li>{{ t('deal.form.rule2') }}</li>
          <li>{{ t('deal.form.rule3') }}</li>
        </ul>
      </div>
      <div class="dac__field">
        <span class="dac__label">{{ t('deal.form.fulfilled') }}</span>
        <UiSegmented
          v-model="verdict"
          class="dac__verdict"
          :items="verdicts"
          :label="t('deal.form.fulfilled')"
          data-testid="deal-verdict"
        />
      </div>
      <DealCalc
        :rows="calcRows"
        :note="
          verdict === 'yes'
            ? t('deal.form.yourFee', { fee: pk(paidMoney.fee) })
            : t('deal.form.noFee')
        "
        :note-tone="verdict === 'yes' ? 'success' : 'muted'"
      />
    </template>

    <template v-if="transfer && !stale">
      <UiCheckbox v-model="confirmed" class="dac__confirm" data-testid="deal-confirm">{{
        mode === 'pay' ? t('deal.form.confirmPay') : t('deal.form.confirmDecide')
      }}</UiCheckbox>
      <UiAlert
        v-if="failure"
        :tone="failure.kind === 'cancel' ? 'warning' : 'danger'"
        :title="failureTitle"
        live
        data-testid="deal-failure"
      >
        {{ failureText }}
      </UiAlert>
      <div class="dac__go">
        <UiButton
          :size="52"
          block
          :variant="transfer.to === 'buyer' ? 'danger' : 'primary'"
          :disabled="!canSend"
          :loading="busy"
          data-testid="deal-transfer"
          @click="dialogOpen = true"
          >{{ transfer.label }}</UiButton
        >
        <p class="dac__wallet">{{ t('deal.form.wallet') }}</p>
      </div>
      <p v-if="mode === 'decide' && verdict === 'yes'" class="dac__hint">
        {{ t('deal.form.noHint', { amount: pk(state.paid) }) }}
      </p>
      <UiAlert tone="warning">{{
        mode === 'pay' ? t('deal.form.oneTx') : t('deal.form.oneTxValidator')
      }}</UiAlert>
    </template>

    <UiButton
      v-if="mode === 'sent' || mode === 'transit' || mode === 'paying'"
      variant="outline"
      icon="retry"
      :loading="refreshing"
      data-testid="deal-refresh-inline"
      @click="emit('refresh')"
      >{{ refreshing ? t('deal.refreshing') : t('deal.refresh') }}</UiButton
    >

    <TransferDialog
      v-if="transfer"
      v-model:open="dialogOpen"
      :title="transfer.title"
      :recipient="`${names[transfer.to]} · ${t(`deal.roleLower.${transfer.to}`)}`"
      :amount="`${pk(transfer.amount)} PKOIN`"
      :sending="busy"
      @confirm="confirmTransfer"
    />
  </section>
</template>

<style scoped>
.dac {
  padding: 28px;
  border: 2px solid transparent;
  border-radius: var(--radius-xl);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

.dac--turn {
  border-color: var(--primary);
}

.dac > :deep(.ui-alert),
.dac__go,
.dac__field,
.dac__confirm,
.dac__rules {
  max-width: 556px;
}

.dac__eyebrow {
  margin-bottom: -12px;
  color: var(--primary);
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
}

.dac__title {
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
}

.dac__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dac__label {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.dac__input {
  max-width: 320px;
}

.dac__hint,
.dac__wallet,
.dac__tx {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.dac__wallet {
  display: none;
  text-align: center;
}

.dac__tx {
  font-family: var(--font-mono);
}

.dac__error {
  color: var(--danger);
  font-size: 13px;
  line-height: 18px;
}

.dac__rules {
  padding: 16px;
  border-radius: var(--radius-l);
  background: var(--info-soft);
  font-size: 13px;
  line-height: 20px;
}

.dac__rules h3 {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 700;
}

.dac__rules li::before {
  content: '• ';
}

.dac__verdict {
  max-width: 326px;
}

.dac__progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
}

.dac__progress-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text2);
}

.dac__progress-item--done {
  color: var(--text);
}

.dac__progress-item--done :deep(svg) {
  width: 20px;
  height: 20px;
  padding: 3px;
  box-sizing: border-box;
  border-radius: 50%;
  background: var(--success);
  color: #fff;
}

.dac__progress-item--now {
  color: var(--text);
  font-weight: 600;
}

.dac__ring {
  width: 20px;
  height: 20px;
  flex: none;
  box-sizing: border-box;
  border: 2px solid var(--border-strong);
  border-radius: 50%;
}

.dac__progress-item--now .dac__ring {
  border-color: var(--primary);
}

.dac > :deep(.ui-button) {
  align-self: flex-start;
}

@media (max-width: 767px) {
  .dac {
    padding: 20px 16px;
  }

  .dac__title {
    font-size: 18px;
    line-height: 24px;
  }

  .dac__eyebrow {
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.02em;
  }

  /* The button stays in reach while the form scrolls (s7-dealbuyer-mobile). */
  .dac__go {
    position: sticky;
    bottom: calc(var(--tabbar-h, 64px) + 8px);
    z-index: 5;
    margin: 0 -8px;
    padding: 8px;
    border-radius: var(--radius-l);
    background: var(--surface);
    box-shadow: var(--shadow-2);
  }

  .dac__wallet {
    display: block;
    margin-top: 6px;
  }

  .dac > :deep(.ui-button) {
    align-self: stretch;
  }
}
</style>
