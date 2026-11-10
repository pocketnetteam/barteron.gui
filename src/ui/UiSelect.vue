<script setup lang="ts" generic="T extends string | number">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useFieldControl } from './field'
import UiIcon from './UiIcon.vue'

export interface SelectOption<V> {
  value: V
  label: string
}

const props = withDefaults(
  defineProps<{
    options: SelectOption<T>[]
    id?: string
    placeholder?: string
    size?: 44 | 48
    invalid?: boolean
    disabled?: boolean
    /** Accessible name when there is no UiField label. */
    label?: string
  }>(),
  { size: 44 }
)

const model = defineModel<T>()
const control = useFieldControl(props)
const listId = `${useId()}-list`

const open = ref(false)
const active = ref(-1)
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()

const selectedIndex = computed(() => props.options.findIndex((o) => o.value === model.value))
const selectedLabel = computed(() => props.options[selectedIndex.value]?.label)

function optionId(index: number): string {
  return `${listId}-${index}`
}

function show(): void {
  if (control.value.disabled) return
  open.value = true
  active.value = selectedIndex.value >= 0 ? selectedIndex.value : 0
}

function hide(focusTrigger = true): void {
  open.value = false
  if (focusTrigger) void nextTick(() => trigger.value?.focus())
}

function choose(index: number): void {
  const option = props.options[index]
  if (option) model.value = option.value
  hide()
}

function move(delta: number): void {
  const count = props.options.length
  if (!count) return
  active.value = (active.value + delta + count) % count
}

function onKeydown(event: KeyboardEvent): void {
  if (!open.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      show()
    }
    return
  }
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      break
    case 'Home':
      event.preventDefault()
      active.value = 0
      break
    case 'End':
      event.preventDefault()
      active.value = props.options.length - 1
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      choose(active.value)
      break
    case 'Escape':
      event.preventDefault()
      hide()
      break
    case 'Tab':
      hide(false)
      break
  }
}

function onDocumentPointer(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) hide(false)
}

watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', onDocumentPointer)
  else document.removeEventListener('pointerdown', onDocumentPointer)
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointer))
</script>

<template>
  <div ref="root" class="ui-select" :class="{ 'ui-select--open': open }">
    <button
      :id="control.id"
      ref="trigger"
      type="button"
      class="ui-select__trigger"
      :class="[`ui-select__trigger--h${size}`, { 'ui-select__trigger--invalid': control.invalid }]"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && active >= 0 ? optionId(active) : undefined"
      :aria-label="label"
      :aria-describedby="control.describedBy"
      :aria-invalid="control.invalid || undefined"
      :disabled="control.disabled"
      @click="open ? hide() : show()"
      @keydown="onKeydown"
    >
      <span :class="{ 'ui-select__placeholder': !selectedLabel }">
        {{ selectedLabel ?? placeholder }}
      </span>
      <UiIcon class="ui-select__chevron" name="chevron" :size="18" :stroke="2" />
    </button>

    <ul v-show="open" :id="listId" class="ui-select__list" role="listbox" tabindex="-1">
      <li
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="String(option.value)"
        class="ui-select__option"
        :class="{
          'ui-select__option--active': index === active,
          'ui-select__option--selected': index === selectedIndex,
        }"
        role="option"
        :aria-selected="index === selectedIndex"
        @pointerenter="active = index"
        @click="choose(index)"
      >
        <span>{{ option.label }}</span>
        <UiIcon v-if="index === selectedIndex" name="check" :size="18" :stroke="2" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.ui-select {
  position: relative;
  min-width: 0;
}

.ui-select__trigger {
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 12px 0 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-m);
  background: var(--surface);
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  transition:
    border-color var(--duration),
    box-shadow var(--duration);
}

.ui-select__trigger--h48 {
  height: 48px;
}

.ui-select__trigger:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.ui-select__trigger:focus-visible {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-select--open .ui-select__trigger {
  border-color: var(--primary);
}

.ui-select__trigger--invalid {
  border-color: var(--danger);
}

.ui-select__trigger:disabled {
  background: var(--disabled-bg);
  border-color: transparent;
  color: var(--disabled-fg);
  cursor: not-allowed;
}

.ui-select__placeholder {
  color: var(--text3);
}

.ui-select__chevron {
  color: var(--text2);
  transition: transform var(--duration);
}

.ui-select--open .ui-select__chevron {
  transform: rotate(180deg);
}

.ui-select__list {
  position: absolute;
  z-index: var(--z-popover);
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 320px;
  overflow: auto;
  padding: 6px;
  border-radius: var(--radius-m);
  background: var(--surface);
  box-shadow: var(--shadow-2);
  outline: none;
}

.ui-select__option {
  padding: 10px;
  border-radius: var(--radius-s);
  font-size: 14px;
  line-height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.ui-select__option--active {
  background: var(--muted);
}

.ui-select__option--selected {
  background: var(--primary-soft);
  color: var(--link);
  font-weight: 600;
}
</style>
