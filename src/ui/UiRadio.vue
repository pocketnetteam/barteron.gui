<script setup lang="ts" generic="T extends string | number">
import { computed } from 'vue'

const props = defineProps<{ modelValue?: T; value: T; name?: string; disabled?: boolean }>()
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
  <label class="ui-radio" :class="{ 'ui-radio--disabled': disabled }">
    <input
      v-model="model"
      class="ui-radio__input visually-hidden"
      type="radio"
      :name="name"
      :value="value"
      :disabled="disabled"
    />
    <span class="ui-radio__dot" aria-hidden="true" />
    <span class="ui-radio__label"><slot /></span>
  </label>
</template>

<style scoped>
.ui-radio {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 28px;
  font-size: 15px;
  line-height: 20px;
  cursor: pointer;
}

.ui-radio__dot {
  flex: none;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border-strong);
  transition: border var(--duration);
}

.ui-radio:hover .ui-radio__dot {
  border-color: var(--text3);
}

.ui-radio__input:checked + .ui-radio__dot {
  border: 6px solid var(--primary);
}

.ui-radio__input:focus-visible + .ui-radio__dot {
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-radio--disabled {
  color: var(--disabled-fg);
  cursor: not-allowed;
}

.ui-radio--disabled .ui-radio__dot {
  background: var(--disabled-bg);
  border-color: transparent;
}
</style>
