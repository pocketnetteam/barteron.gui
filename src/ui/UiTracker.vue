<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiIcon from './UiIcon.vue'

export interface TrackerStep {
  title: string
  text?: string
}

/** Horizontal stages with a description under each (safe deal: 1 → 2 → 3 → 4). */
defineProps<{
  steps: TrackerStep[]
  /** Index of the current stage, 0-based; earlier stages are done. */
  current: number
}>()

const { t } = useI18n()
</script>

<template>
  <ol class="ui-tracker">
    <li
      v-for="(step, i) in steps"
      :key="i"
      class="ui-tracker__step"
      :class="{
        'ui-tracker__step--done': i < current,
        'ui-tracker__step--current': i === current,
        'ui-tracker__step--pending': i > current,
      }"
      :aria-current="i === current ? 'step' : undefined"
    >
      <div class="ui-tracker__head">
        <span class="ui-tracker__dot">
          <UiIcon v-if="i < current" name="check" :size="16" :stroke="3" />
          <span v-else aria-hidden="true">{{ i + 1 }}</span>
        </span>
        <span v-if="i < steps.length - 1" class="ui-tracker__line" aria-hidden="true" />
      </div>
      <span class="ui-tracker__title">
        {{ step.title }}
        <span v-if="i < current" class="visually-hidden">. {{ t('ui.stepDone') }}</span>
      </span>
      <span v-if="step.text" class="ui-tracker__text">{{ step.text }}</span>
    </li>
  </ol>
</template>

<style scoped>
.ui-tracker {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
}

.ui-tracker__step {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 16px;
}

.ui-tracker__step:last-child {
  padding-right: 0;
}

.ui-tracker__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ui-tracker__dot {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.ui-tracker__line {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: var(--border);
}

.ui-tracker__step--done .ui-tracker__dot {
  background: var(--success);
  color: #ffffff;
}

.ui-tracker__step--done .ui-tracker__line {
  background: var(--success);
}

.ui-tracker__step--current .ui-tracker__dot {
  background: var(--primary);
  color: #ffffff;
  box-shadow: 0 0 0 4px var(--ring);
}

.ui-tracker__title {
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
}

.ui-tracker__text {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.ui-tracker__step--pending .ui-tracker__title {
  color: var(--text2);
}

.ui-tracker__step--pending .ui-tracker__text {
  color: var(--text3);
}

/* Phones: stages stack vertically */
@media (max-width: 767px) {
  .ui-tracker {
    grid-auto-flow: row;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .ui-tracker__step {
    display: grid;
    grid-template-columns: 32px 1fr;
    column-gap: 12px;
    row-gap: 2px;
    padding-right: 0;
  }

  .ui-tracker__head {
    grid-row: span 2;
    align-self: start;
  }

  .ui-tracker__line {
    display: none;
  }
}
</style>
