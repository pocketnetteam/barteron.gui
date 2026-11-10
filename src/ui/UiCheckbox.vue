<script setup lang="ts">
import UiIcon from './UiIcon.vue'

defineProps<{ disabled?: boolean; name?: string; value?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="ui-check" :class="{ 'ui-check--disabled': disabled }">
    <input
      v-model="model"
      class="ui-check__input visually-hidden"
      type="checkbox"
      :name="name"
      :value="value"
      :disabled="disabled"
    />
    <span class="ui-check__box" aria-hidden="true">
      <UiIcon v-if="model" name="check" :size="14" :stroke="3" />
    </span>
    <span class="ui-check__label"><slot /></span>
  </label>
</template>

<style scoped>
.ui-check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 28px;
  font-size: 15px;
  line-height: 20px;
  cursor: pointer;
}

.ui-check__box {
  flex: none;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-xs);
  border: 1.5px solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition:
    background-color var(--duration),
    border-color var(--duration);
}

.ui-check:hover .ui-check__box {
  border-color: var(--text3);
}

.ui-check__input:checked + .ui-check__box {
  background: var(--primary);
  border-color: var(--primary);
}

.ui-check__input:focus-visible + .ui-check__box {
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-check--disabled {
  color: var(--disabled-fg);
  cursor: not-allowed;
}

.ui-check--disabled .ui-check__box,
.ui-check--disabled:hover .ui-check__box {
  background: var(--disabled-bg);
  border-color: transparent;
}
</style>
