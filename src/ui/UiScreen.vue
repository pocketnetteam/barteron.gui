<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from './UiIcon.vue'

/**
 * A full-screen layer on the phone: search, categories, filters
 * (s2-search-mobile, s2-categories-mobile, s2-filters-mobile). Back arrow or
 * Escape closes it; the page under it does not scroll.
 */
const props = withDefaults(
  defineProps<{
    title?: string
    /** `close` — × on the left (filters); `back` — ← (search, categories). */
    dismiss?: 'back' | 'close'
  }>(),
  { dismiss: 'back' }
)
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const titleId = `scr-${useId()}`
const panel = ref<HTMLElement>()
let returnFocus: HTMLElement | null = null

function close() {
  open.value = false
  emit('close')
}

function lock(on: boolean) {
  document.documentElement.style.overflow = on ? 'hidden' : ''
}

watch(
  open,
  async (value) => {
    lock(value)
    if (value) {
      returnFocus = document.activeElement as HTMLElement | null
      await nextTick()
      // Only fields that ask for it (search): a keyboard popping up over filters is in the way.
      const auto = panel.value?.querySelector<HTMLElement>('[autofocus]')
      ;(auto ?? panel.value)?.focus()
    } else {
      returnFocus?.focus?.()
      returnFocus = null
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => lock(false))
defineExpose({ close })
void props
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-screen">
      <div
        v-if="open"
        ref="panel"
        class="ui-screen"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        tabindex="-1"
        @keydown.esc.stop="close"
      >
        <div class="ui-screen__head">
          <button
            type="button"
            class="ui-screen__dismiss"
            :aria-label="dismiss === 'close' ? t('ui.close') : t('ui.back')"
            @click="close"
          >
            <UiIcon :name="dismiss === 'close' ? 'close' : 'back'" :size="24" :stroke="2" />
          </button>
          <slot name="head">
            <h2 :id="titleId" class="ui-screen__title">{{ title }}</h2>
          </slot>
          <slot name="head-end" />
        </div>
        <div class="ui-screen__body"><slot /></div>
        <div v-if="$slots.footer" class="ui-screen__footer"><slot name="footer" /></div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-screen {
  position: fixed;
  z-index: var(--z-modal);
  inset: 0;
  background: var(--surface);
  color: var(--text);
  display: flex;
  flex-direction: column;
  outline: none;
}

.ui-screen__head {
  flex: none;
  min-height: 60px;
  /* The host close button may sit at the top right (lib/host-insets.ts). */
  padding: 8px max(16px, var(--host-corner, 0px)) 8px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border);
}

.ui-screen__dismiss {
  flex: none;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-m);
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-screen__dismiss:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-screen__title {
  flex: 1;
  margin: 0;
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
}

.ui-screen__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-top: 12px;
}

.ui-screen__footer {
  flex: none;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.ui-screen-enter-active,
.ui-screen-leave-active {
  transition:
    opacity var(--duration),
    transform var(--duration);
}

.ui-screen-enter-from,
.ui-screen-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
