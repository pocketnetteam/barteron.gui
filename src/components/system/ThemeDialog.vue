<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useThemeStore, type ThemePreference } from '@/stores/theme'
import UiDialog from '@/ui/UiDialog.vue'

/**
 * «Тема» (s8-sheets-mobile): system, light, dark, each with a small picture
 * of the page. The old blue theme is gone (stage 1).
 */
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const theme = useThemeStore()
const OPTIONS: ThemePreference[] = ['system', 'light', 'dark']

function pick(value: ThemePreference) {
  theme.setPreference(value)
  open.value = false
}
</script>

<template>
  <UiDialog v-model:open="open" :title="t('theme.title')" :width="440">
    <div class="th" role="radiogroup" :aria-label="t('theme.title')" data-testid="theme-dialog">
      <button
        v-for="value in OPTIONS"
        :key="value"
        type="button"
        class="th__card"
        role="radio"
        :aria-checked="theme.preference === value"
        :class="{ 'th__card--on': theme.preference === value }"
        :data-theme-option="value"
        @click="pick(value)"
      >
        <span class="th__pic" :class="`th__pic--${value}`" aria-hidden="true">
          <span class="th__bar" />
          <span class="th__body" />
          <span class="th__btn" />
        </span>
        <span class="th__name">{{ t(`theme.option.${value}`) }}</span>
      </button>
    </div>
  </UiDialog>
</template>

<style scoped>
.th {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.th__card {
  padding: 6px 6px 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font: 500 13px / 18px var(--font-sans);
  cursor: pointer;
}

.th__card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.th__card--on {
  border: 2px solid var(--primary);
  padding: 5px 5px 9px;
  color: var(--link);
  font-weight: 600;
}

/* The page in miniature: fixed colours, the picture shows the other theme too. */
.th__pic {
  position: relative;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  background: #f4f4f6;
}

.th__pic--dark {
  background: #0e0e13;
}

.th__pic--system {
  background: linear-gradient(90deg, #f4f4f6 50%, #0e0e13 50%);
}

.th__bar {
  position: absolute;
  top: 10px;
  left: 8px;
  width: 50%;
  height: 7px;
  border-radius: 4px;
  background: #c9c9d3;
}

.th__body {
  position: absolute;
  top: 24px;
  left: 8px;
  right: 8px;
  height: 58px;
  border-radius: 6px;
  background: #ffffff;
}

.th__btn {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 10px;
  height: 12px;
  border-radius: 4px;
  background: #5b3cf0;
}

.th__pic--dark .th__bar {
  background: #2e2e3a;
}

.th__pic--dark .th__body {
  background: #18181f;
}

.th__pic--system .th__body {
  background: linear-gradient(90deg, #ffffff 50%, #18181f 50%);
}
</style>
