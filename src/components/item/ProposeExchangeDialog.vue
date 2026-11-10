<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import type { OfferPrice } from '@/components/offer/types'
import UiBadge from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiIcon from '@/ui/UiIcon.vue'

export interface MyOfferOption {
  id: string
  title: string
  photo: string | null
  price: OfferPrice
  /** Its category is among what the seller wants. */
  fits: boolean
}

/**
 * «Что предложить взамен?» (s3-item-dialogs, s3-exchange-mobile): one of my
 * active offers goes to the seller's chat with «Предлагаю обмен».
 */
const props = defineProps<{
  target: string
  seller: string
  options: MyOfferOption[]
  loading?: boolean
  sending?: boolean
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ propose: [id: string] }>()
const { t } = useI18n()
const name = `px-${useId()}`

/** Fitting ones first, as in the mockup. */
const sorted = computed(() => [...props.options].sort((a, b) => Number(b.fits) - Number(a.fits)))
const picked = ref<string | null>(null)
watch(
  [open, sorted],
  () => {
    if (open.value && (!picked.value || !sorted.value.some((o) => o.id === picked.value))) {
      picked.value = sorted.value[0]?.id ?? null
    }
  },
  { immediate: true }
)
</script>

<template>
  <UiDialog v-model:open="open" :title="t('item.propose.title')" :width="560" :closable="!sending">
    <p class="px__sub">{{ t('item.propose.subtitle', { title: target, seller }) }}</p>

    <p v-if="loading" class="px__empty">{{ t('item.propose.loading') }}</p>
    <div v-else-if="!sorted.length" class="px__empty">
      <p>{{ t('item.propose.empty') }}</p>
    </div>
    <ul v-else class="px__list" role="radiogroup" :aria-label="t('item.propose.title')">
      <li v-for="o in sorted" :key="o.id">
        <label class="px__item" :class="{ 'px__item--on': picked === o.id }">
          <input v-model="picked" class="px__radio" type="radio" :name="name" :value="o.id" />
          <OfferPhoto class="px__photo" :src="o.photo" ratio="4 / 3" radius="8px" />
          <span class="px__text">
            <span class="px__title">{{ o.title }}</span>
            <PriceTag :price="o.price" :size="14" no-equivalent />
          </span>
          <UiBadge v-if="o.fits" class="px__fits" tone="primary" pill>{{
            t('item.propose.fits')
          }}</UiBadge>
        </label>
      </li>
    </ul>

    <RouterLink class="px__create" :to="{ name: 'createBarter' }" @click="open = false">
      <UiIcon name="plus" :size="18" :stroke="2" />
      {{ t('item.propose.create') }}
    </RouterLink>
    <p class="px__note">{{ t('item.propose.note') }}</p>

    <template #actions>
      <UiButton class="px__cancel" variant="neutral" :disabled="sending" @click="open = false">
        {{ t('ui.cancel') }}
      </UiButton>
      <UiButton
        :disabled="!picked"
        :loading="sending"
        external
        data-testid="propose-send"
        @click="picked && emit('propose', picked)"
      >
        {{ t('item.buy.exchange') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.px__sub {
  margin-top: -8px;
  margin-bottom: 12px;
  color: var(--text2);
  font-size: 14px;
}

.px__empty {
  padding: 16px 0;
  color: var(--text2);
}

.px__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.px__item {
  padding: 10px 12px;
  border: 2px solid transparent;
  border-radius: var(--radius-l);
  background: var(--subtle);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.px__item--on {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.px__radio {
  flex: none;
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--primary);
}

.px__photo {
  width: 56px;
  flex: none;
}

.px__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.px__title {
  font-weight: 600;
  font-size: 15px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.px__fits {
  flex: none;
}

.px__create {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--link);
  font-weight: 600;
}

.px__note {
  margin-top: 16px;
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

@media (max-width: 767px) {
  .px__cancel {
    display: none;
  }
}
</style>
