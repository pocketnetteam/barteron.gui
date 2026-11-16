<script setup lang="ts" generic="T extends string | number">
import { useFieldControl } from './field'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    id?: string
    type?: string
    placeholder?: string
    /** 48 — forms, 44 — filters and dense panels. */
    size?: 44 | 48
    /** Text before the value, e.g. «от». */
    prefix?: string
    /** Unit after the value, e.g. «PKOIN». */
    suffix?: string
    invalid?: boolean
    disabled?: boolean
  }>(),
  { type: 'text', size: 48 }
)

const model = defineModel<T>({ required: true })
const control = useFieldControl(props)
</script>

<template>
  <div
    class="ui-input"
    :class="[
      `ui-input--h${size}`,
      { 'ui-input--invalid': control.invalid, 'ui-input--disabled': control.disabled },
    ]"
  >
    <slot name="prefix">
      <span v-if="prefix" class="ui-input__affix">{{ prefix }}</span>
    </slot>
    <input
      :id="control.id"
      v-model="model"
      class="ui-input__control"
      :type="type"
      :placeholder="placeholder"
      :disabled="control.disabled"
      :aria-invalid="control.invalid || undefined"
      :aria-describedby="control.describedBy"
      v-bind="$attrs"
    />
    <slot name="suffix">
      <span v-if="suffix" class="ui-input__suffix">{{ suffix }}</span>
    </slot>
  </div>
</template>

<style scoped>
.ui-input {
  box-sizing: border-box;
  height: 48px;
  padding: 0 14px;
  border: 1.5px solid transparent;
  border-radius: var(--radius-m);
  background: var(--muted);
  display: flex;
  align-items: center;
  gap: 8px;
  transition:
    border-color var(--duration),
    box-shadow var(--duration),
    background-color var(--duration);
}

.ui-input--h44 {
  height: 44px;
  padding: 0 12px;
  gap: 6px;
}

.ui-input:hover:not(.ui-input--disabled) {
  border-color: var(--border-strong);
}

.ui-input:focus-within {
  background: var(--surface);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-input--invalid,
.ui-input--invalid:hover:not(.ui-input--disabled) {
  background: var(--surface);
  border-color: var(--danger);
}

.ui-input--disabled {
  background: var(--disabled-bg);
  color: var(--disabled-fg);
}

.ui-input__control {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  outline: none;
}

.ui-input__control::placeholder {
  color: var(--text3);
  opacity: 1;
}

.ui-input__control:disabled {
  color: var(--disabled-fg);
  -webkit-text-fill-color: var(--disabled-fg);
}

.ui-input__affix {
  flex: none;
  font-size: 14px;
  color: var(--text3);
}

.ui-input__suffix {
  flex: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--text2);
}
</style>
