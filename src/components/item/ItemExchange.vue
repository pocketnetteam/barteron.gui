<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ExchangeList from '@/components/offer/ExchangeList.vue'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import type { ExchangeItem } from '@/components/offer/types'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import ItemSection from './ItemSection.vue'

/** «Меняю на» (s3-item): the categories the seller wants, and my offer that fits. */
defineProps<{
  title: string
  items: ExchangeItem[]
  anything?: boolean
  /** «Отдам даром» */
  free?: boolean
  fit?: { title: string; photo: string | null; category: string } | null
  /** The owner looks at it: no «Предложить обмен». */
  own?: boolean
  editTo?: boolean
}>()
defineEmits<{ propose: []; edit: [] }>()
const { t } = useI18n()
</script>

<template>
  <ItemSection :title="title" heading-id="item-exchange">
    <template #end>
      <button v-if="editTo" type="button" class="ix__edit" @click="$emit('edit')">
        {{ t('item.exchange.edit') }}
      </button>
      <span v-else-if="!own && !free" class="ix__note">{{ t('item.exchange.ready') }}</span>
    </template>

    <p v-if="free" class="ix__free">{{ t('item.exchange.free') }}</p>
    <ExchangeList v-else variant="block" :items="items" :anything="anything" />

    <div v-if="fit && !own" class="ix__fit">
      <OfferPhoto class="ix__photo" :src="fit.photo" ratio="1 / 1" radius="10px" />
      <div class="ix__fit-text">
        <strong>{{ t('item.exchange.fits', { title: fit.title }) }}</strong>
        <span class="ix__fit-desktop">{{
          t('item.exchange.fitsWhy', { category: fit.category })
        }}</span>
        <span class="ix__fit-phone">{{ t('item.exchange.fitsPhone') }}</span>
      </div>
      <UiButton class="ix__fit-desktop" :size="40" @click="$emit('propose')">
        {{ t('item.buy.exchange') }}
      </UiButton>
      <button
        type="button"
        class="ix__fit-phone ix__fit-go"
        :aria-label="t('item.buy.exchange')"
        @click="$emit('propose')"
      >
        <UiIcon name="chevron-right" :size="20" :stroke="2" />
      </button>
    </div>
  </ItemSection>
</template>

<style scoped>
.ix__note {
  color: var(--text2);
}

.ix__edit {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.ix__free {
  font-size: 15px;
  line-height: 22px;
}

.ix__fit {
  position: relative;
  padding: 14px;
  border-radius: var(--radius-l);
  background: var(--primary-soft);
  display: flex;
  align-items: center;
  gap: 16px;
}

.ix__photo {
  width: 56px;
  flex: none;
}

.ix__fit-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.ix__fit-text strong {
  color: var(--text);
  font-size: 15px;
  line-height: 20px;
}

.ix__fit-phone {
  display: none;
}

.ix__fit-go {
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  align-items: center;
  justify-content: center;
}

.ix__fit-go::after {
  content: '';
  position: absolute;
  inset: 0;
}

@media (max-width: 767px) {
  .ix__note {
    display: none;
  }

  .ix__fit {
    padding: 12px;
    gap: 12px;
  }

  .ix__photo {
    width: 48px;
  }

  .ix__fit-desktop {
    display: none;
  }

  .ix__fit-phone {
    display: inline;
  }

  .ix__fit-go {
    display: flex;
  }
}
</style>
