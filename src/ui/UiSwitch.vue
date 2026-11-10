<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="ui-switch" :class="{ 'ui-switch--disabled': disabled }">
    <input
      v-model="model"
      class="ui-switch__input visually-hidden"
      type="checkbox"
      role="switch"
      :aria-checked="model"
      :disabled="disabled"
    />
    <span class="ui-switch__track" aria-hidden="true"><span class="ui-switch__thumb" /></span>
    <span class="ui-switch__label"><slot /></span>
  </label>
</template>

<style scoped>
.ui-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 28px;
  font-size: 15px;
  line-height: 20px;
  cursor: pointer;
}

.ui-switch__track {
  flex: none;
  box-sizing: border-box;
  width: 40px;
  height: 24px;
  padding: 2px;
  border-radius: var(--radius-full);
  background: var(--border-strong);
  display: flex;
  transition: background-color var(--duration);
}

.ui-switch__thumb {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: #ffffff;
  transition: transform var(--duration);
}

.ui-switch__input:checked + .ui-switch__track {
  background: var(--primary);
}

.ui-switch__input:checked + .ui-switch__track .ui-switch__thumb {
  transform: translateX(16px);
}

.ui-switch__input:focus-visible + .ui-switch__track {
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-switch--disabled {
  color: var(--disabled-fg);
  cursor: not-allowed;
}

.ui-switch--disabled .ui-switch__track {
  background: var(--muted);
}

.ui-switch--disabled .ui-switch__thumb {
  background: var(--surface);
}
</style>
