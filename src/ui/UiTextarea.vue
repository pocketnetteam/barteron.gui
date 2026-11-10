<script setup lang="ts">
import { useFieldControl } from './field'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    id?: string
    placeholder?: string
    rows?: number
    invalid?: boolean
    disabled?: boolean
  }>(),
  { rows: 3 }
)

const model = defineModel<string>({ default: '' })
const control = useFieldControl(props)
</script>

<template>
  <textarea
    :id="control.id"
    v-model="model"
    class="ui-textarea"
    :class="{ 'ui-textarea--invalid': control.invalid }"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="control.disabled"
    :aria-invalid="control.invalid || undefined"
    :aria-describedby="control.describedBy"
    v-bind="$attrs"
  />
</template>

<style scoped>
.ui-textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid transparent;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text);
  font: 400 15px / 22px var(--font-sans);
  resize: vertical;
  outline: none;
  transition:
    border-color var(--duration),
    box-shadow var(--duration),
    background-color var(--duration);
}

.ui-textarea::placeholder {
  color: var(--text3);
  opacity: 1;
}

.ui-textarea:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.ui-textarea:focus {
  background: var(--surface);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-textarea--invalid,
.ui-textarea--invalid:hover:not(:disabled) {
  background: var(--surface);
  border-color: var(--danger);
}

.ui-textarea:disabled {
  background: var(--disabled-bg);
  color: var(--disabled-fg);
  resize: none;
}
</style>
