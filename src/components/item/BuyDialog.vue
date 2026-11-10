<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import type { OfferPrice } from '@/components/offer/types'
import UiButton from '@/ui/UiButton.vue'
import UiChoiceCard from '@/ui/UiChoiceCard.vue'
import UiDialog from '@/ui/UiDialog.vue'

/**
 * «Купить» (s3-item-dialogs «Покупка напрямую — что уйдёт в чат»). When the
 * seller takes PKOIN the old app first asked «безопасная сделка или
 * напрямую»; the safe deal itself comes with stage 8, so it is shown but off.
 */
const props = defineProps<{
  title: string
  price: OfferPrice
  photo: string | null
  /** What the chat gets besides the offer link: «Вариант получения товара: …». */
  lines: string[]
  /** The seller takes PKOIN and the way is not a pickup point (old `safeDealAvailableForOffer`). */
  safeDealPossible?: boolean
  sending?: boolean
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
const { t } = useI18n()

const step = ref<'type' | 'preview'>('preview')
const type = ref<'direct' | 'safe'>('direct')
watch(
  open,
  (value) => {
    if (value) {
      step.value = props.safeDealPossible ? 'type' : 'preview'
      type.value = 'direct'
    }
  },
  { immediate: true }
)
</script>

<template>
  <UiDialog
    v-model:open="open"
    :title="step === 'type' ? t('item.purchase.typeTitle') : t('item.purchase.title')"
    :width="560"
    :closable="!sending"
  >
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
        :description="t('app.soon')"
        disabled
      />
    </div>

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
      <UiButton variant="neutral" :disabled="sending" @click="open = false">{{
        t('ui.cancel')
      }}</UiButton>
      <UiButton v-if="step === 'type'" @click="step = 'preview'">{{ t('ui.next') }}</UiButton>
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
