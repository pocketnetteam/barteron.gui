<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GuarantorPicker from '@/components/deal/GuarantorPicker.vue'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import type { OfferPrice } from '@/components/offer/types'
import { useGuarantors, type GuarantorOption } from '@/composables/safe-deal'
import type { FeeVariant } from '@/models/safe-deal'
import { useUiStore } from '@/stores/ui'
import UiButton from '@/ui/UiButton.vue'
import UiChoiceCard from '@/ui/UiChoiceCard.vue'
import UiDialog from '@/ui/UiDialog.vue'

/**
 * «Купить» (s3-item-dialogs). When the seller takes PKOIN the old app first
 * asked «безопасная сделка или напрямую»: directly — what goes to the chat;
 * through a safe deal — «Выберите гаранта», then the deal chat.
 */
const props = defineProps<{
  title: string
  price: OfferPrice
  photo: string | null
  /** What the chat gets besides the offer link: «Вариант получения товара: …». */
  lines: string[]
  /** The seller takes PKOIN and the way is not a pickup point (old `safeDealAvailableForOffer`). */
  safeDealPossible?: boolean
  /** Who pays the guarantor's fee, from the offer. */
  feeVariant?: FeeVariant
  /** The offer's price in PKOIN; `null` — no rate for its currency. */
  pkoin?: number | null
  /** The seller and me: neither can be the guarantor. */
  exclude?: string[]
  sending?: boolean
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: []; safe: [guarantor: GuarantorOption] }>()
const { t } = useI18n()
const ui = useUiStore()

const step = ref<'type' | 'preview' | 'guarantor'>('preview')
const type = ref<'direct' | 'safe'>('direct')
const guarantor = ref<string | null>(null)
watch(
  open,
  (value) => {
    if (value) {
      step.value = props.safeDealPossible ? 'type' : 'preview'
      type.value = 'direct'
      guarantor.value = null
    }
  },
  { immediate: true }
)

const guarantors = useGuarantors(
  () => props.exclude ?? [],
  () => !!props.safeDealPossible
)
const options = computed(() => (props.safeDealPossible ? guarantors.list.value : []))
// The first available one is chosen, like the old dialog's top line.
watch(options, (list) => {
  if (!guarantor.value || !list.some((o) => o.address === guarantor.value && o.available)) {
    guarantor.value = list.find((o) => o.available)?.address ?? null
  }
})
const chosen = computed(
  () => options.value.find((o) => o.address === guarantor.value && o.available) ?? null
)

const safeText = computed(() =>
  props.feeVariant === 'seller'
    ? t('deal.buy.safeSeller')
    : props.feeVariant === 'inHalf'
      ? t('deal.buy.safeHalf')
      : t('deal.buy.safeBuyer')
)
const dialogTitle = computed(() =>
  step.value === 'type'
    ? t('item.purchase.typeTitle')
    : step.value === 'guarantor'
      ? t('deal.buy.guarantorTitle')
      : t('item.purchase.title')
)

function next() {
  step.value = type.value === 'safe' ? 'guarantor' : 'preview'
}

function confirmSafe() {
  if (chosen.value) emit('safe', chosen.value)
}
</script>

<template>
  <UiDialog v-model:open="open" :title="dialogTitle" :width="560" :closable="!sending">
    <div v-if="step === 'type'" class="bd__types" role="radiogroup">
      <UiChoiceCard
        v-model="type"
        value="direct"
        name="buy-type"
        :title="t('item.purchase.direct')"
        :description="t('item.purchase.directText')"
      />
      <UiChoiceCard
        v-model="type"
        value="safe"
        name="buy-type"
        :title="t('item.purchase.safe')"
        :description="safeText"
        data-testid="buy-type-safe"
      />
      <button type="button" class="bd__how" @click="ui.openSafeDealHelp()">
        {{ t('deal.buy.details') }}
      </button>
    </div>

    <GuarantorPicker
      v-else-if="step === 'guarantor'"
      v-model="guarantor"
      :options="options"
      :loading="guarantors.query.isPending.value"
      :failed="guarantors.query.isError.value"
      :price="pkoin ?? null"
      :variant="feeVariant ?? 'buyer'"
      @retry="guarantors.query.refetch()"
    />

    <template v-else>
      <div class="bd__bubble">
        <p v-for="(line, i) in lines" :key="i">{{ line }}</p>
        <div class="bd__card">
          <OfferPhoto class="bd__photo" :src="photo" ratio="4 / 3" radius="6px" />
          <span class="bd__card-title">{{ title }}</span>
          <PriceTag :price="price" :size="14" no-equivalent />
        </div>
      </div>
      <p class="bd__note">{{ t('item.purchase.note') }}</p>
    </template>

    <template #actions>
      <UiButton
        v-if="step === 'guarantor'"
        variant="neutral"
        :disabled="sending"
        @click="step = 'type'"
        >{{ t('deal.buy.back') }}</UiButton
      >
      <UiButton v-else variant="neutral" :disabled="sending" @click="open = false">{{
        t('ui.cancel')
      }}</UiButton>
      <UiButton v-if="step === 'type'" data-testid="buy-next" @click="next">{{
        t('ui.next')
      }}</UiButton>
      <UiButton
        v-else-if="step === 'guarantor'"
        external
        :loading="sending"
        :disabled="!chosen"
        data-testid="buy-open-deal"
        @click="confirmSafe"
      >
        {{ t('deal.buy.open') }}
      </UiButton>
      <UiButton
        v-else
        variant="contrast"
        external
        :loading="sending"
        data-testid="buy-open-chat"
        @click="emit('confirm')"
      >
        {{ t('item.purchase.openChat') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.bd__types {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bd__how {
  align-self: flex-start;
  padding: 4px 0 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.bd__bubble {
  margin-left: auto;
  max-width: 400px;
  padding: 14px;
  border-radius: 16px 16px 4px 16px;
  background: var(--primary-soft);
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  line-height: 20px;
}

.bd__card {
  padding: 8px;
  border-radius: var(--radius-m);
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.bd__photo {
  width: 40px;
  flex: none;
}

.bd__card-title {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bd__note {
  margin-top: 16px;
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}
</style>
