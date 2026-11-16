<script setup lang="ts" generic="T extends string | number">
import { computed } from 'vue'
import type { IconName } from './icons'
import UiIcon from './UiIcon.vue'

/**
 * A large radio option: delivery methods, «Как купить?», deal types.
 * With `icon` the icon replaces the radio dot (sheets); `trailingIcon` sits on the right.
 */
const props = defineProps<{
  modelValue?: T
  value: T
  name?: string
  title: string
  description?: string
  icon?: IconName
  trailingIcon?: IconName
  disabled?: boolean
}>()

/**
 * Nothing is chosen yet while the model is undefined; a press always sends this
 * option's value. The native v-model keeps the dot right when the parent refuses.
 */
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (value !== undefined) emit('update:modelValue', value)
  },
})
</script>

<template>
  <label
    class="ui-choice"
    :class="{ 'ui-choice--selected': modelValue === value, 'ui-choice--disabled': disabled }"
  >
    <input
      v-model="model"
      class="ui-choice__input visually-hidden"
      type="radio"
      :name="name"
      :value="value"
      :disabled="disabled"
    />
    <UiIcon v-if="icon" class="ui-choice__icon" :name="icon" :size="24" />
    <span v-else class="ui-choice__dot" aria-hidden="true" />
    <span class="ui-choice__body">
      <span class="ui-choice__title">{{ title }}</span>
      <span v-if="description" class="ui-choice__text">{{ description }}</span>
      <slot />
    </span>
    <UiIcon v-if="trailingIcon" class="ui-choice__trailing" :name="trailingIcon" :size="24" />
  </label>
</template>

<style scoped>
.ui-choice {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  box-shadow: inset 0 0 0 1.5px var(--border);
  cursor: pointer;
  transition:
    box-shadow var(--duration),
    background-color var(--duration);
}

.ui-choice:hover {
  box-shadow: inset 0 0 0 1.5px var(--border-strong);
}

.ui-choice--selected,
.ui-choice--selected:hover {
  background: var(--primary-soft);
  box-shadow: inset 0 0 0 2px var(--primary);
}

.ui-choice:focus-within {
  box-shadow:
    inset 0 0 0 2px var(--primary),
    0 0 0 3px var(--ring);
}

.ui-choice--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.ui-choice__dot {
  flex: none;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border-strong);
}

.ui-choice--selected .ui-choice__dot {
  border: 6px solid var(--primary);
}

.ui-choice__icon {
  color: var(--text2);
}

.ui-choice--selected .ui-choice__icon,
.ui-choice--selected .ui-choice__trailing {
  color: var(--link);
}

.ui-choice__trailing {
  color: var(--text3);
}

.ui-choice__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ui-choice__title {
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text);
}

.ui-choice__text {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}
</style>
