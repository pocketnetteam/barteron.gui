<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSpinner from '@/ui/UiSpinner.vue'

export type TxStepState = 'done' | 'active' | 'pending' | 'error'

export interface TxStep {
  label: string
  detail?: string
  /** Show the detail in mono (a tx hash). */
  mono?: boolean
  state: TxStepState
}

/**
 * Transaction panel: the detailed level of the network status
 * (label → toast → panel). The window can be closed; the status updates itself.
 */
defineProps<{
  title: string
  subtitle?: string
  steps: TxStep[]
}>()
defineEmits<{ close: [] }>()
const { t } = useI18n()

const LINE: Record<TxStepState, string> = {
  done: 'var(--success)',
  active: 'var(--warning)',
  error: 'var(--danger)',
  pending: 'var(--border)',
}
</script>

<template>
  <section class="tx" :aria-label="title">
    <div class="tx__head">
      <div class="tx__titles">
        <h3 class="tx__title">{{ title }}</h3>
        <span v-if="subtitle" class="tx__subtitle">{{ subtitle }}</span>
      </div>
      <UiButton
        variant="ghost"
        :size="36"
        icon="close"
        :label="t('net.hidePanel')"
        @click="$emit('close')"
      />
    </div>

    <ol class="tx__steps" role="list">
      <li
        v-for="(step, i) in steps"
        :key="i"
        class="tx__step"
        :class="`tx__step--${step.state}`"
        :aria-current="step.state === 'active' ? 'step' : undefined"
      >
        <div class="tx__rail">
          <span class="tx__dot">
            <UiIcon v-if="step.state === 'done'" name="check" :size="13" :stroke="3" />
            <UiSpinner v-else-if="step.state === 'active'" :size="14" :stroke="2.6" />
            <UiIcon v-else-if="step.state === 'error'" name="error" :size="14" :stroke="2.4" />
            <span v-else aria-hidden="true">{{ i + 1 }}</span>
          </span>
          <span
            v-if="i < steps.length - 1"
            class="tx__line"
            :style="{ background: LINE[steps[i + 1]!.state] }"
            aria-hidden="true"
          />
        </div>
        <div class="tx__text">
          <span class="tx__label">
            {{ step.label }}
            <span class="visually-hidden">— {{ t(`net.step.${step.state}`) }}</span>
          </span>
          <span v-if="step.detail" class="tx__detail" :class="{ 't-mono': step.mono }">{{
            step.detail
          }}</span>
          <slot :name="`step-${i}`" />
        </div>
      </li>
    </ol>

    <div v-if="$slots.actions" class="tx__actions"><slot name="actions" /></div>
  </section>
</template>

<style scoped>
.tx {
  padding: 24px;
  border-radius: var(--radius-l);
  background: var(--surface);
  box-shadow: var(--shadow-2);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tx__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.tx__titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tx__title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.tx__subtitle {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.tx__step {
  display: flex;
  gap: 12px;
  min-height: 48px;
}

.tx__step:last-child {
  min-height: 0;
}

.tx__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tx__dot {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.tx__step--done .tx__dot {
  background: var(--success);
  color: #ffffff;
}

.tx__step--active .tx__dot {
  background: var(--warning-soft);
  color: var(--warning);
}

.tx__step--error .tx__dot {
  background: var(--danger-soft);
  color: var(--danger);
}

.tx__line {
  flex: 1;
  width: 2px;
}

.tx__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 12px;
  min-width: 0;
}

.tx__label {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.tx__step--pending .tx__label {
  color: var(--text2);
}

.tx__step--error .tx__label {
  color: var(--danger);
}

.tx__detail {
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

.tx__detail.t-mono {
  font-size: 12px;
  font-weight: 400;
}

.tx__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
