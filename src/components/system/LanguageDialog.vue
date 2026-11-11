<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LOCALE_CHOICES, useLocaleStore, type LocaleChoice } from '@/stores/locale'
import UiDialog from '@/ui/UiDialog.vue'

/** «Язык» (s8-sheets-mobile): Bastyon's language or one of the three. */
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const localeStore = useLocaleStore()

function pick(choice: LocaleChoice) {
  localeStore.set(choice)
  open.value = false
}
</script>

<template>
  <UiDialog v-model:open="open" :title="t('language.title')" :width="400">
    <div
      class="lang"
      role="radiogroup"
      :aria-label="t('language.title')"
      data-testid="language-dialog"
    >
      <button
        v-for="choice in LOCALE_CHOICES"
        :key="choice"
        type="button"
        class="lang__row"
        role="radio"
        :aria-checked="localeStore.choice === choice"
        :data-choice="choice"
        @click="pick(choice)"
      >
        <span class="lang__dot" :class="{ 'lang__dot--on': localeStore.choice === choice }" />
        <span class="lang__name">{{ t(`language.${choice}`) }}</span>
        <span v-if="choice === 'inherit'" class="lang__now">{{
          t('language.now', { name: t(`language.${localeStore.effective}`) })
        }}</span>
      </button>
    </div>
  </UiDialog>
</template>

<style scoped>
.lang {
  margin: 0 -8px;
  display: flex;
  flex-direction: column;
}

.lang__row {
  min-height: 52px;
  padding: 0 8px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  font: 400 16px / 22px var(--font-sans);
  cursor: pointer;
}

.lang__row:hover {
  background: var(--subtle);
}

.lang__row:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--ring);
}

.lang__dot {
  flex: none;
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  border: 2px solid var(--border-strong);
}

.lang__dot--on {
  border: 7px solid var(--primary);
}

.lang__name {
  flex: 1;
}

.lang__now {
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}
</style>
