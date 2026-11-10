<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from './UiIcon.vue'

/**
 * Modal dialog. `auto` is a centred window on desktop and a bottom sheet on
 * phones (< 768 px), as in the marketplace sheet.
 */
const props = withDefaults(
  defineProps<{
    title: string
    presentation?: 'auto' | 'modal' | 'sheet'
    /** Escape, the overlay and the × close it. Off while a transaction is being sent. */
    closable?: boolean
    width?: number
  }>(),
  { presentation: 'auto', closable: true, width: 440 }
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const titleId = `dlg-${useId()}`
const panel = ref<HTMLElement>()
let returnFocus: HTMLElement | null = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables(): HTMLElement[] {
  return Array.from(panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
}

function close(): void {
  if (!props.closable) return
  open.value = false
  emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    close()
    return
  }
  if (event.key !== 'Tab') return
  const items = focusables()
  if (!items.length) {
    event.preventDefault()
    panel.value?.focus()
    return
  }
  const first = items[0]!
  const last = items[items.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

let locked = false
function lockScroll(on: boolean): void {
  if (on === locked) return
  locked = on
  const count = Number(document.body.dataset.dialogs ?? 0) + (on ? 1 : -1)
  document.body.dataset.dialogs = String(Math.max(0, count))
  document.body.style.overflow = count > 0 ? 'hidden' : ''
}

watch(
  open,
  async (value) => {
    if (value) {
      returnFocus = document.activeElement as HTMLElement | null
      lockScroll(true)
      await nextTick()
      const target =
        panel.value?.querySelector<HTMLElement>('[autofocus]') ??
        focusables().find((el) => !el.classList.contains('ui-dialog__close')) ??
        panel.value
      target?.focus()
    } else {
      lockScroll(false)
      returnFocus?.focus?.()
      returnFocus = null
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => lockScroll(false))
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-dialog">
      <div
        v-if="open"
        class="ui-dialog"
        :class="`ui-dialog--${presentation}`"
        @click.self="close"
        @keydown="onKeydown"
      >
        <div
          ref="panel"
          class="ui-dialog__panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          :style="{ '--w': `${width}px` }"
        >
          <span class="ui-dialog__grabber" aria-hidden="true" />
          <div class="ui-dialog__head">
            <h2 :id="titleId" class="ui-dialog__title">{{ title }}</h2>
            <button
              v-if="closable"
              type="button"
              class="ui-dialog__close"
              :aria-label="t('ui.close')"
              @click="close"
            >
              <UiIcon name="close" :size="18" :stroke="2" />
            </button>
          </div>
          <div class="ui-dialog__body"><slot /></div>
          <div v-if="$slots.actions" class="ui-dialog__actions"><slot name="actions" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-dialog {
  position: fixed;
  z-index: var(--z-modal);
  inset: 0;
  padding: 16px;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.ui-dialog__panel {
  box-sizing: border-box;
  width: 100%;
  max-width: var(--w);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-3);
  display: flex;
  flex-direction: column;
  gap: 16px;
  outline: none;
}

.ui-dialog__grabber {
  display: none;
  align-self: center;
  width: 36px;
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--border-strong);
}

.ui-dialog__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.ui-dialog__title {
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
}

.ui-dialog__close {
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: var(--muted);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-dialog__close:hover {
  background: var(--muted-hover);
}

.ui-dialog__close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-dialog__body {
  font-size: 15px;
  line-height: 22px;
  color: var(--text2);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ui-dialog__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

/* Bottom sheet */
.ui-dialog--sheet {
  align-items: flex-end;
  padding: 48px 0 0;
}

.ui-dialog--sheet .ui-dialog__panel {
  max-width: none;
  max-height: calc(100vh - 48px);
  padding: 10px 16px calc(20px + env(safe-area-inset-bottom, 0px));
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  gap: 14px;
}

.ui-dialog--sheet .ui-dialog__grabber {
  display: block;
}

.ui-dialog--sheet .ui-dialog__actions > :deep(*) {
  flex: 1;
}

@media (max-width: 767px) {
  .ui-dialog--auto {
    align-items: flex-end;
    padding: 48px 0 0;
  }

  .ui-dialog--auto .ui-dialog__panel {
    max-width: none;
    max-height: calc(100vh - 48px);
    padding: 10px 16px calc(20px + env(safe-area-inset-bottom, 0px));
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    gap: 14px;
  }

  .ui-dialog--auto .ui-dialog__grabber {
    display: block;
  }

  .ui-dialog--auto .ui-dialog__actions > :deep(*) {
    flex: 1;
  }
}

/* Transitions */
.ui-dialog-enter-active,
.ui-dialog-leave-active {
  transition: opacity 160ms ease;
}

.ui-dialog-enter-active .ui-dialog__panel,
.ui-dialog-leave-active .ui-dialog__panel {
  transition: transform 200ms ease;
}

.ui-dialog-enter-from,
.ui-dialog-leave-to {
  opacity: 0;
}

.ui-dialog-enter-from .ui-dialog__panel,
.ui-dialog-leave-to .ui-dialog__panel {
  transform: scale(0.97);
}

.ui-dialog--sheet.ui-dialog-enter-from .ui-dialog__panel,
.ui-dialog--sheet.ui-dialog-leave-to .ui-dialog__panel {
  transform: translateY(24px);
}
</style>
