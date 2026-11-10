<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BastyonLink from '@/components/BastyonLink.vue'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'

/**
 * «Как продвинуть объявление» (s3-item-dialogs). Barteron has no paid
 * placement: the offer is shared to Bastyon and the post is boosted there
 * (old «Как рекламировать объявление» → bastyon.com/boost).
 */
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ share: []; more: [] }>()
const { t } = useI18n()
</script>

<template>
  <UiDialog v-model:open="open" :title="t('item.promote.title')" :width="520">
    <ol class="pd__steps">
      <li v-for="n in 3" :key="n">
        <span class="pd__num" aria-hidden="true">{{ n }}</span>
        <span>{{ t(`item.promote.step${n}`) }}</span>
      </li>
    </ol>
    <BastyonLink class="pd__more" @open="emit('more')">{{ t('item.promote.more') }}</BastyonLink>
    <template #actions>
      <UiButton variant="neutral" @click="open = false">{{ t('item.promote.ok') }}</UiButton>
      <UiButton icon="share" @click="emit('share')">{{ t('item.share') }}</UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.pd__steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 15px;
  line-height: 22px;
}

.pd__steps li {
  display: flex;
  gap: 12px;
}

.pd__num {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  background: var(--warning-soft);
  color: var(--warning);
  font: 700 13px / 26px var(--font-sans);
  text-align: center;
}

.pd__more {
  margin-top: 16px;
  font-size: 14px;
}
</style>
