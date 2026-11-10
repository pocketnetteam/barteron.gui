<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiIcon from './UiIcon.vue'

/** Wizard progress: «Категория → Фото → Обмен и цена → Проверка». */
defineProps<{
  steps: string[]
  /** Index of the current step, 0-based. */
  current: number
}>()

const { t } = useI18n()
</script>

<template>
  <div class="ui-steps">
    <ol class="ui-steps__track">
      <template v-for="(step, i) in steps" :key="i">
        <li
          class="ui-steps__dot"
          :class="{
            'ui-steps__dot--done': i < current,
            'ui-steps__dot--current': i === current,
          }"
          :aria-current="i === current ? 'step' : undefined"
        >
          <UiIcon v-if="i < current" name="check" :size="14" :stroke="3" />
          <span v-else aria-hidden="true">{{ i + 1 }}</span>
          <span class="visually-hidden">
            {{ step }}.
            {{ i < current ? t('ui.stepDone') : i === current ? t('ui.stepCurrent') : '' }}
          </span>
        </li>
        <li
          v-if="i < steps.length - 1"
          class="ui-steps__line"
          :class="{ 'ui-steps__line--done': i < current }"
          aria-hidden="true"
        />
      </template>
    </ol>
    <div class="ui-steps__labels" aria-hidden="true" :style="{ '--n': steps.length }">
      <span
        v-for="(step, i) in steps"
        :key="i"
        class="ui-steps__label"
        :class="{ 'ui-steps__label--current': i === current }"
      >
        {{ step }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.ui-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ui-steps__track {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ui-steps__dot {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.ui-steps__dot--done,
.ui-steps__dot--current {
  background: var(--primary);
  color: #ffffff;
}

.ui-steps__dot--current {
  box-shadow: 0 0 0 4px var(--ring);
}

.ui-steps__line {
  flex: 1;
  height: 2px;
  background: var(--border);
}

.ui-steps__line--done {
  background: var(--primary);
}

.ui-steps__labels {
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  font-size: 12px;
  line-height: 16px;
  color: var(--text2);
}

.ui-steps__label:last-child {
  text-align: right;
}

.ui-steps__label--current {
  color: var(--text);
  font-weight: 600;
}
</style>
