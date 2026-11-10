<script setup lang="ts">
import { computed, provide, useId } from 'vue'
import { FIELD_KEY } from './field'
import UiIcon from './UiIcon.vue'

const props = defineProps<{
  label?: string
  hint?: string
  /** Shown instead of the hint and marks the control invalid. */
  error?: string
  /** Characters typed, shown with `max` as «24 / 80». */
  count?: number
  max?: number
  disabled?: boolean
  /** The label is a plain caption, not a <label> (for groups of controls). */
  group?: boolean
}>()

const id = `f-${useId()}`
const hintId = `${id}-hint`

const context = computed(() => ({
  id,
  describedBy: props.error || props.hint || props.max ? hintId : undefined,
  invalid: !!props.error,
  disabled: !!props.disabled,
}))
provide(FIELD_KEY, context)
</script>

<template>
  <div class="ui-field" :class="{ 'ui-field--disabled': disabled }">
    <span v-if="label && group" :id="`${id}-label`" class="ui-field__label">{{ label }}</span>
    <label v-else-if="label" :for="id" class="ui-field__label">{{ label }}</label>
    <slot :id="id" :described-by="context.describedBy" :invalid="context.invalid" />
    <div v-if="error" :id="hintId" class="ui-field__hint ui-field__hint--error" role="alert">
      <UiIcon name="error" :size="14" :stroke="2" />
      <span>{{ error }}</span>
    </div>
    <div v-else-if="hint || max" :id="hintId" class="ui-field__hint">
      <span>{{ hint }}</span>
      <span v-if="max" class="ui-field__count tabular">{{ count ?? 0 }} / {{ max }}</span>
    </div>
  </div>
</template>

<style scoped>
.ui-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.ui-field__label {
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: var(--text);
}

.ui-field--disabled .ui-field__label {
  color: var(--disabled-fg);
}

.ui-field__hint {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

.ui-field__hint--error {
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
  color: var(--danger);
}

.ui-field__count {
  flex: none;
}
</style>
