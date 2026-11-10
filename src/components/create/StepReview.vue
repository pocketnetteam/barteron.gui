<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardContext } from '@/components/offer/card-context'
import OfferTile from '@/components/offer/OfferTile.vue'
import { useOfferForm } from '@/composables/offer-form'
import { usePlaceName } from '@/composables/place-name'
import { formatMoney, formatPkoin } from '@/lib/format'
import { txErrorText } from '@/lib/tx-errors'
import {
  draftPrice,
  isPointDraft,
  parsePrice,
  PKOIN,
  safeDealPossible,
  type DraftIssue,
  type DraftStep,
} from '@/models/draft'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import StepHead from './StepHead.vue'

/** Step 5 (s4-preview): the card as buyers will see it, a summary by step, what is missing. */
const { t, locale } = useI18n()
const form = useOfferForm()
const cardCtx = useCardContext()
const { categories, rates, myList } = form
const d = computed(() => form.draft.value!)
const point = computed(() => isPointDraft(d.value))
const placeName = usePlaceName(() => d.value.geohash)

const label = (id: number | null) => (id === null ? '' : (categories.label(id) ?? String(id)))
const list = (ids: readonly number[]) => ids.map((id) => label(id)).join(', ')

interface Row {
  key: string
  step: DraftStep
  title: string
  value: string
}

const pkoin = (value: number) => `${formatPkoin(value, locale.value)} PKOIN`

const priceValue = computed(() => {
  const price = draftPrice(d.value, rates.data.value ?? null)
  const amount = parsePrice(d.value.price)
  if (!price.ok || !Number.isFinite(amount)) return t('create.review.notSet')
  const main =
    d.value.currency === PKOIN
      ? pkoin(amount)
      : `${formatMoney(amount, d.value.currency, locale.value)} ≈ ${pkoin(price.pkoin)}`
  const parts = [d.value.priceFrom ? t('create.review.priceFrom', { price: main }) : main]
  if (d.value.currency !== PKOIN && d.value.fixCurrency) {
    parts.push(t('create.review.fixed', { currency: d.value.currency }))
  }
  return parts.join(' · ')
})

const mediaValue = computed(() => {
  const photos = d.value.photos.filter((p) => p.status === 'ready').length
  const parts = [photos ? t('create.review.photosCount', photos) : t('create.review.noPhotos')]
  if (d.value.video && !point.value) {
    const duration = form.videoInfo.value?.duration
    const order =
      d.value.videoOrder === 'last' ? t('create.review.videoLast') : t('create.review.videoFirst')
    parts.push(duration ? `${order} (${duration})` : order)
  }
  return parts.join(', ')
})

const exchangeValue = computed(() => {
  switch (d.value.exchange) {
    case 'for_nothing':
      return t('create.review.free')
    case 'anything':
      return t('create.review.anything')
    case 'my_list':
      return t('create.review.myList', { list: list(myList.value) || '—' })
    default:
      return list(d.value.tags) || t('create.review.notSet')
  }
})

const safeValue = computed(() => {
  if (!safeDealPossible(d.value, myList.value)) return t('create.review.safeOff')
  if (d.value.fee === 'inHalf') return t('create.review.safeHalf')
  if (d.value.fee === 'seller') return t('create.review.safeSeller')
  return t('create.review.safeBuyer')
})

const placeValue = computed(() =>
  d.value.geohash
    ? (placeName.data.value ?? t('create.place.pointOnMap'))
    : t('create.review.notSet')
)

const deliveryValue = computed(() => {
  const parts: string[] = []
  if (d.value.selfPickup.on) parts.push(t('create.review.deliverySelf'))
  if (d.value.directDelivery.on) parts.push(t('create.review.deliveryDirect'))
  if (d.value.pickupPoints.on && d.value.pickupPoints.ids.length) {
    parts.push(t('create.review.deliveryPoints', d.value.pickupPoints.ids.length))
  }
  if (!parts.length) return t('create.review.noDelivery')
  const text = parts.join(', ')
  return text.charAt(0).toLocaleUpperCase(locale.value) + text.slice(1)
})

const scheduleValue = computed(() => {
  const open = d.value.point.days.filter((day) => day.open)
  if (open.length === 7 && open.every((day) => day.allDay)) return t('create.point.roundTheClock')
  return open.length ? t('create.review.workDays', open.length) : t('create.review.notSet')
})

const short = (text: string, max = 90) => {
  const value = text.trim().replace(/\s+/g, ' ')
  return value.length > max ? `${value.slice(0, max - 1)}…` : value || t('create.review.notSet')
}

const rows = computed<Row[]>(() => {
  const category = [
    label(d.value.tag),
    !point.value && (d.value.condition === 'used' ? t('create.what.used') : t('create.what.new')),
  ]
    .filter(Boolean)
    .join(' · ')
  const head: Row[] = [
    // The title is on the card; a row only when it is missing.
    ...(d.value.caption.trim()
      ? []
      : [
          {
            key: 'caption',
            step: 'what' as const,
            title: t('create.what.caption'),
            value: t('create.review.notSet'),
          },
        ]),
    {
      key: 'category',
      step: 'what',
      title: t('create.review.category'),
      value: category || t('create.review.notSet'),
    },
    {
      key: 'description',
      step: 'what',
      title: t('create.review.description'),
      value: short(d.value.description),
    },
    {
      key: 'media',
      step: 'media',
      title: point.value ? t('create.review.photos') : t('create.review.media'),
      value: mediaValue.value,
    },
  ]
  if (point.value) {
    const cost = parsePrice(d.value.price)
    return [
      ...head,
      {
        key: 'cost',
        step: 'point',
        title: t('create.review.cost'),
        value:
          Number.isFinite(cost) && cost > 0
            ? t('create.review.priceFrom', { price: pkoin(cost) })
            : t('create.review.notSet'),
      },
      {
        key: 'terms',
        step: 'point',
        title: t('create.review.terms'),
        value: short(d.value.point.financialTerms),
      },
      {
        key: 'schedule',
        step: 'point',
        title: t('create.review.schedule'),
        value: scheduleValue.value,
      },
      {
        key: 'address',
        step: 'point',
        title: t('create.review.address'),
        value: short(d.value.point.address),
      },
      { key: 'place', step: 'place', title: t('create.review.place'), value: placeValue.value },
    ]
  }
  const sell: Row[] = [
    ...head,
    {
      key: 'exchange',
      step: 'exchange',
      title: t('create.review.exchange'),
      value: exchangeValue.value,
    },
  ]
  if (d.value.exchange !== 'for_nothing') {
    sell.push(
      { key: 'price', step: 'exchange', title: t('create.review.price'), value: priceValue.value },
      { key: 'safe', step: 'exchange', title: t('create.review.safe'), value: safeValue.value }
    )
  }
  sell.push(
    { key: 'place', step: 'place', title: t('create.review.place'), value: placeValue.value },
    {
      key: 'delivery',
      step: 'place',
      title: t('create.review.delivery'),
      value: deliveryValue.value,
    }
  )
  return sell
})

/** Which issue a row stands for: rows map to the fields of their step. */
const FIELDS: Record<string, string[]> = {
  caption: ['caption'],
  category: ['category'],
  description: ['description'],
  media: ['photos', 'video'],
  exchange: ['tags'],
  price: ['price'],
  cost: ['price'],
  terms: ['financialTerms'],
  schedule: ['schedule'],
  address: ['address', 'route'],
  place: ['place'],
  delivery: ['delivery'],
}
const issueOf = (row: Row): DraftIssue | undefined =>
  form.issues.value.find((i) => i.step === row.step && FIELDS[row.key]?.includes(i.field))

const preview = computed(() => form.offer.value)
const previewRoute = computed(() => ({
  name: 'draftPreview',
  query: form.hash.value ? { edit: form.hash.value } : {},
}))
/** The reason as a sentence of its own: «… для комиссии.» */
const error = computed(() => {
  if (!form.publishError.value) return null
  const text = txErrorText(form.publishError.value, t)
  return /[.!?…]$/.test(text) ? text : `${text}.`
})
</script>

<template>
  <StepHead
    :n="form.stepIndex.value + 1"
    :total="form.steps.value.length"
    :title="t('create.review.title')"
  />

  <UiAlert v-if="error" tone="danger" icon="error" data-testid="create-publish-error" live>
    <strong>{{ t('create.review.failedTitle') }}</strong> {{ error }}
    {{ t('create.review.failedKept') }}
    <template #action>
      <UiButton
        variant="contrast"
        :size="40"
        :disabled="!form.canPublish.value"
        @click="form.publish()"
      >
        {{ t('create.review.retry') }}
      </UiButton>
    </template>
  </UiAlert>

  <ul v-if="form.issues.value.length" class="sr__issues" data-testid="create-issues">
    <li v-for="issue in form.issues.value" :key="`${issue.step}-${issue.key}`" class="sr__issue">
      <span class="sr__issue-mark" :class="`sr__issue-mark--${issue.level}`" aria-hidden="true">
        {{ issue.level === 'error' ? '!' : '…' }}
      </span>
      <span class="sr__issue-text">{{ form.issueText(issue) }}</span>
      <button
        v-if="issue.level === 'error'"
        type="button"
        class="sr__link"
        @click="form.fix(issue)"
      >
        {{ t('create.review.fix') }}
      </button>
      <span v-else class="sr__wait">{{ t('create.review.wait') }}</span>
    </li>
  </ul>

  <div class="sr__grid">
    <div class="sr__preview">
      <span class="sr__caption">{{ t('create.review.asCard') }}</span>
      <template v-if="preview">
        <div class="sr__tile sr__tile--tile">
          <OfferTile :offer="preview" :context="cardCtx" />
        </div>
        <div class="sr__tile sr__tile--row">
          <OfferTile :offer="preview" :context="cardCtx" view="row" />
        </div>
      </template>
      <RouterLink
        v-if="!point"
        class="sr__full"
        :to="previewRoute"
        data-testid="create-preview-link"
      >
        <span class="sr__full--desk">{{ t('create.review.fullPage') }}</span>
        <span class="sr__full--phone">{{ t('create.review.asBuyer') }}</span>
      </RouterLink>
    </div>

    <ul class="sr__rows">
      <li
        v-for="row in rows"
        :key="row.key"
        class="sr__row"
        :data-testid="`create-review-${row.key}`"
      >
        <span
          class="sr__mark"
          :class="issueOf(row) ? `sr__mark--${issueOf(row)!.level}` : 'sr__mark--ok'"
          aria-hidden="true"
        >
          <UiIcon v-if="!issueOf(row)" name="check" :size="14" :stroke="3" />
          <template v-else>{{ issueOf(row)!.level === 'error' ? '!' : '…' }}</template>
        </span>
        <span class="sr__body">
          <span class="sr__title">{{ row.title }}</span>
          <span class="sr__value">{{ row.value }}</span>
        </span>
        <button type="button" class="sr__link sr__change" @click="form.goTo(row.step)">
          <span class="sr__change-text">{{ t('create.review.change') }}</span>
          <UiIcon class="sr__change-icon" name="chevron-right" :size="18" />
          <span class="visually-hidden">: {{ row.title }}</span>
        </button>
      </li>
    </ul>
  </div>

  <p class="sr__note">{{ t('create.review.publishNote') }}</p>
</template>

<style scoped>
.sr__issues {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sr__issue {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.sr__issue-mark,
.sr__mark {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
}

.sr__issue-mark--error,
.sr__mark--error {
  background: var(--danger-soft);
  color: var(--danger);
}

.sr__issue-mark--wait,
.sr__mark--wait {
  background: var(--warning-soft);
  color: var(--warning);
}

.sr__mark--ok {
  background: var(--success-soft);
  color: var(--success);
}

.sr__issue-text {
  flex: 1;
}

.sr__link {
  border: 0;
  background: transparent;
  padding: 4px;
  color: var(--link);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
}

.sr__link:focus-visible,
.sr__full:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.sr__wait {
  font-size: 13px;
  color: var(--text3);
}

.sr__grid {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.sr__preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sr__caption {
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
}

.sr__tile {
  pointer-events: none;
}

.sr__tile--row {
  display: none;
}

.sr__full {
  font-size: 14px;
  font-weight: 600;
  color: var(--link);
  border-radius: 6px;
}

.sr__full--phone {
  display: none;
}

.sr__rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sr__row {
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.sr__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sr__title {
  font-size: 13px;
  color: var(--text2);
}

.sr__value {
  font-size: 15px;
  overflow-wrap: anywhere;
}

.sr__change-icon {
  display: none;
}

.sr__note {
  display: none;
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: var(--text2);
}

@media (max-width: 767px) {
  .sr__grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .sr__preview {
    padding: 12px;
    border-radius: 16px;
    background: var(--subtle);
  }

  .sr__caption,
  .sr__full--desk,
  .sr__tile--tile {
    display: none;
  }

  .sr__tile--row {
    display: block;
  }

  .sr__full--phone {
    display: inline;
  }

  .sr__change-text {
    display: none;
  }

  .sr__change-icon {
    display: block;
    color: var(--text3);
  }

  .sr__note {
    display: block;
  }
}
</style>
