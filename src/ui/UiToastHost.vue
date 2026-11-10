<script setup lang="ts">
import { dismiss, toasts } from './toast'
import UiToast from './UiToast.vue'
</script>

<template>
  <div class="ui-toasts" aria-live="polite" aria-relevant="additions text">
    <TransitionGroup name="ui-toast">
      <UiToast
        v-for="item in toasts.items"
        :key="item.id"
        :kind="item.kind"
        :text="item.text"
        :action="item.action"
        :role="item.kind === 'error' ? 'alert' : undefined"
        @close="dismiss(item.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.ui-toasts {
  position: fixed;
  z-index: var(--z-toast);
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  width: min(440px, calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.ui-toasts > * {
  pointer-events: auto;
}

/* Above the tab bar on phones */
@media (max-width: 767px) {
  .ui-toasts {
    bottom: calc(var(--tabbar-h) + 12px + env(safe-area-inset-bottom, 0px));
  }
}

.ui-toast-enter-active,
.ui-toast-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.ui-toast-enter-from,
.ui-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
