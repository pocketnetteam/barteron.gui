<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

/**
 * A panel under a button: menus of the header (currency, language, theme,
 * profile), «Где искать», search hints. Not modal: a click outside or Escape
 * closes it, and focus goes back to the button.
 */
const props = withDefaults(
  defineProps<{
    anchor: HTMLElement | null | undefined
    /** Which edge of the anchor the panel lines up with. */
    align?: 'start' | 'end' | 'stretch'
    width?: number
    /** Accessible name of the panel. */
    label: string
    /** Gap under the anchor. */
    offset?: number
    /** Keep focus in the anchor (search hints under a text field). */
    keepFocus?: boolean
  }>(),
  { align: 'start', width: 320, offset: 8, keepFocus: false }
)

const open = defineModel<boolean>('open', { default: false })
const panel = ref<HTMLElement>()
const style = ref<Record<string, string>>({})

function place() {
  const anchor = props.anchor
  if (!anchor) return
  const rect = anchor.getBoundingClientRect()
  const gutter = 8
  const viewport = document.documentElement.clientWidth
  const width =
    props.align === 'stretch' ? rect.width : Math.min(props.width, viewport - gutter * 2)
  let left = props.align === 'end' ? rect.right - width : rect.left
  left = Math.max(gutter, Math.min(left, viewport - width - gutter))
  const top = rect.bottom + props.offset
  style.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${Math.max(160, window.innerHeight - top - gutter)}px`,
  }
}

let frame = 0
const schedule = () => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(place)
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (panel.value?.contains(target) || props.anchor?.contains(target)) return
  open.value = false
}

function close(returnFocus = true) {
  open.value = false
  if (returnFocus) props.anchor?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    close()
  }
}

function listen(on: boolean) {
  if (on) {
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
  } else {
    document.removeEventListener('pointerdown', onPointerDown, true)
    window.removeEventListener('scroll', schedule, true)
    window.removeEventListener('resize', schedule)
  }
}

watch(
  open,
  async (value) => {
    listen(value)
    if (!value) return
    place()
    await nextTick()
    if (!props.keepFocus) panel.value?.focus()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  listen(false)
  cancelAnimationFrame(frame)
})

defineExpose({ close, place })
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-popover">
      <div
        v-if="open"
        ref="panel"
        class="ui-popover"
        role="dialog"
        :aria-label="label"
        tabindex="-1"
        :style="style"
        @keydown="onKeydown"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-popover {
  position: fixed;
  z-index: var(--z-popover);
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: var(--radius-l);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-3);
  outline: none;
}

.ui-popover-enter-active,
.ui-popover-leave-active {
  transition:
    opacity var(--duration),
    transform var(--duration);
}

.ui-popover-enter-from,
.ui-popover-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
