<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LEGAL_DOCS, useOpenDoc } from '@/composables/docs'
import UiDialog from '@/ui/UiDialog.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Юридическая информация» (s8-dialogs): the old app's three documents. They
 * exist in Russian only; in English and Serbian the window says so.
 */
const open = defineModel<boolean>('open', { default: false })
const { t, locale } = useI18n()
const openDoc = useOpenDoc()
</script>

<template>
  <UiDialog v-model:open="open" :title="t('legal.title')" :width="480">
    <ul class="legal" data-testid="legal-dialog">
      <li v-for="doc in LEGAL_DOCS" :key="doc.key">
        <button type="button" class="legal__row" @click="openDoc(doc.file)">
          <UiIcon name="document" :size="20" class="legal__icon" />
          <span class="legal__name">{{ t(`footer.${doc.key}`) }}</span>
          <UiIcon name="external" :size="16" class="legal__icon" />
        </button>
      </li>
    </ul>
    <p v-if="locale !== 'ru'" class="legal__note">{{ t('legal.inRussian') }}</p>
  </UiDialog>
</template>

<style scoped>
.legal {
  margin: 0 -8px;
  padding: 0;
  list-style: none;
}

.legal__row {
  width: 100%;
  min-height: 48px;
  padding: 10px 8px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  font: 400 15px / 20px var(--font-sans);
  cursor: pointer;
}

.legal__row:hover {
  background: var(--subtle);
}

.legal__row:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.legal__icon {
  flex: none;
  color: var(--text2);
}

.legal__name {
  flex: 1;
}

.legal__note {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}
</style>
