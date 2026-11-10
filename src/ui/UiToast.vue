<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ToastAction, ToastKind } from './toast'
import UiIcon from './UiIcon.vue'
import UiSpinner from './UiSpinner.vue'

defineProps<{ kind: ToastKind; text: string; action?: ToastAction }>()
defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="ui-toast" :class="`ui-toast--${kind}`">
    <UiSpinner v-if="kind === 'progress'" class="ui-toast__icon" :size="18" />
    <UiIcon
      v-else
      class="ui-toast__icon"
      :name="kind === 'error' ? 'error' : kind === 'info' ? 'info' : 'check'"
      :size="18"
      :stroke="kind === 'success' ? 2.4 : 2"
    />
    <span class="ui-toast__text">{{ text }}</span>
    <button v-if="action" type="button" class="ui-toast__action" @click="action.run()">
      {{ action.label }}
    </button>
    <button
      v-else-if="kind !== 'progress'"
      type="button"
      class="ui-toast__close"
      :aria-label="t('ui.close')"
      @click="$emit('close')"
    >
      <UiIcon name="close" :size="16" :stroke="2" />
    </button>
  </div>
</template>

<style scoped>
.ui-toast {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--contrast);
  color: var(--on-contrast);
  box-shadow: var(--shadow-2);
}

.ui-toast--success .ui-toast__icon {
  color: var(--on-contrast-success);
}

.ui-toast--error .ui-toast__icon {
  color: var(--on-contrast-danger);
}

.ui-toast--info .ui-toast__icon {
  color: var(--on-contrast-link);
}

.ui-toast__text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 18px;
}

.ui-toast__action {
  flex: none;
  padding: 4px;
  border: 0;
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--on-contrast-link);
  font: 600 13px / 18px var(--font-sans);
}

.ui-toast__close {
  flex: none;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-s);
  background: transparent;
  color: inherit;
  opacity: 0.6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-toast__close:hover {
  opacity: 1;
}

.ui-toast__action:focus-visible,
.ui-toast__close:focus-visible {
  outline: 2px solid var(--on-contrast-link);
}
</style>
