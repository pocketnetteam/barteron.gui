<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppLogo from '@/components/layout/AppLogo.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

export type WizardStepState = 'done' | 'current' | 'todo' | 'error'

export interface WizardStep {
  label: string
  state: WizardStepState
}

export interface WizardHint {
  title: string
  text: string
}

/**
 * Frame of the offer form (s4): its own header instead of the site one, the
 * steps on the left, tips on the right. On the phone: a top bar with the step
 * count and a progress line, the button pinned at the bottom.
 */
defineProps<{
  title: string
  /** Phone top bar; the review step names itself there. */
  phoneTitle?: string
  steps: WizardStep[]
  current: number
  /** «Черновик сохранён на устройстве». */
  saved?: boolean
  hints?: WizardHint[]
  /** The review takes the tips' column too. */
  wide?: boolean
}>()
const emit = defineEmits<{ exit: []; back: []; step: [index: number] }>()
const { t } = useI18n()
</script>

<template>
  <div class="wz" data-testid="create">
    <header class="wz__header">
      <div class="wz__header-in">
        <AppLogo />
        <span class="wz__title">{{ title }}</span>
        <span class="wz__spacer" />
        <span v-if="saved" class="wz__saved" data-testid="create-saved">
          <UiIcon name="check" :size="16" :stroke="2.4" />{{ t('create.saved') }}
        </span>
        <UiButton variant="neutral" :size="40" data-testid="create-exit" @click="emit('exit')">
          {{ t('create.exit') }}
        </UiButton>
      </div>
    </header>

    <div class="wz__top">
      <div class="wz__top-row">
        <button
          type="button"
          class="wz__top-btn"
          :aria-label="current === 0 ? t('create.close') : t('create.back')"
          data-testid="create-top-back"
          @click="current === 0 ? emit('exit') : emit('back')"
        >
          <UiIcon :name="current === 0 ? 'close' : 'back'" :size="24" :stroke="2" />
        </button>
        <span class="wz__top-title">{{ phoneTitle ?? title }}</span>
        <span class="wz__top-count tabular">
          {{ t('create.stepShort', { n: current + 1, total: steps.length }) }}
        </span>
      </div>
      <div class="wz__progress" aria-hidden="true">
        <span
          v-for="(s, i) in steps"
          :key="i"
          class="wz__bar"
          :class="{ 'wz__bar--on': i <= current, 'wz__bar--error': s.state === 'error' }"
        />
      </div>
    </div>

    <div class="wz__body" :class="{ 'wz__body--wide': wide }">
      <nav class="wz__steps" :aria-label="title">
        <ol>
          <li v-for="(s, i) in steps" :key="i">
            <button
              type="button"
              class="wz__step"
              :class="`wz__step--${s.state}`"
              :aria-current="s.state === 'current' ? 'step' : undefined"
              :data-testid="`create-step-${i + 1}`"
              @click="emit('step', i)"
            >
              <span class="wz__dot">
                <UiIcon v-if="s.state === 'done'" name="check" :size="16" :stroke="2.6" />
                <span v-else-if="s.state === 'error'" aria-hidden="true">!</span>
                <span v-else aria-hidden="true">{{ i + 1 }}</span>
              </span>
              <span class="wz__step-label">{{ s.label }}</span>
              <span v-if="s.state === 'error'" class="visually-hidden">
                — {{ t('create.steps.hasErrors') }}
              </span>
            </button>
          </li>
        </ol>
      </nav>

      <main class="wz__main">
        <div v-if="$slots.top" class="wz__notes"><slot name="top" /></div>
        <div class="wz__card">
          <slot />
        </div>
        <div v-if="$slots.footer" class="wz__footer">
          <slot name="footer" />
        </div>
        <aside v-if="hints?.length && !wide" class="wz__hints wz__hints--phone">
          <h2 class="wz__hints-title">
            <UiIcon name="tip" :size="18" />{{ t('create.hints.title') }}
          </h2>
          <div v-for="h in hints" :key="h.title" class="wz__hint">
            <h3>{{ h.title }}</h3>
            <p>{{ h.text }}</p>
          </div>
        </aside>
      </main>

      <aside v-if="hints?.length && !wide" class="wz__hints wz__hints--desk">
        <h2 class="wz__hints-title">
          <UiIcon name="tip" :size="18" />{{ t('create.hints.title') }}
        </h2>
        <div v-for="h in hints" :key="h.title" class="wz__hint">
          <h3>{{ h.title }}</h3>
          <p>{{ h.text }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.wz {
  min-height: 100vh;
  background: var(--page);
  color: var(--text);
}

/* Desktop header */
.wz__header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.wz__header-in {
  max-width: calc(var(--container) + 2 * var(--page-pad));
  margin: 0 auto;
  padding: 12px max(var(--page-pad), var(--host-corner, 0px)) 12px var(--page-pad);
  display: flex;
  align-items: center;
  gap: 12px 20px;
}

.wz__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text2);
}

.wz__spacer {
  flex: 1;
}

.wz__saved {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text3);
}

.wz__saved :deep(svg) {
  color: var(--success);
}

/* Phone top bar */
.wz__top {
  display: none;
}

/* Body: steps · form · tips */
.wz__body {
  max-width: calc(var(--container) + 2 * var(--page-pad));
  margin: 0 auto;
  padding: 24px var(--page-pad) 64px;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: start;
}

.wz__body--wide {
  grid-template-columns: 240px minmax(0, 1fr);
}

.wz__steps {
  position: sticky;
  top: 24px;
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 16px;
}

.wz__steps ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wz__step {
  width: 100%;
  min-height: 48px;
  padding: 0 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  line-height: 18px;
  text-align: left;
  cursor: pointer;
}

.wz__step:hover {
  background: var(--subtle);
}

.wz__step:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.wz__step--current {
  background: var(--primary-soft);
  font-weight: 600;
}

.wz__step--current:hover {
  background: var(--primary-soft);
}

.wz__dot {
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

.wz__step--current .wz__dot {
  background: var(--primary);
  color: #ffffff;
}

.wz__step--done .wz__dot {
  background: var(--success-soft);
  color: var(--success);
}

.wz__step--error .wz__dot {
  background: var(--danger-soft);
  color: var(--danger);
}

.wz__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wz__notes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wz__notes:empty {
  display: none;
}

.wz__card {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wz__footer {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.wz__hints {
  background: var(--info-soft);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wz__hints--desk {
  position: sticky;
  top: 24px;
}

.wz__hints--phone {
  display: none;
}

.wz__hints-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
}

.wz__hints-title :deep(svg) {
  color: var(--info);
}

.wz__hint h3 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 700;
}

.wz__hint p {
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: var(--text2);
}

@media (max-width: 1100px) {
  .wz__body {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .wz__hints--desk {
    display: none;
  }

  .wz__hints--phone {
    display: flex;
  }
}

/* Phone */
@media (max-width: 767px) {
  .wz {
    background: var(--surface);
  }

  .wz__header,
  .wz__steps {
    display: none;
  }

  .wz__top {
    display: block;
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: calc(var(--app-margin-top, 0px) + 8px) max(8px, var(--host-corner, 0px)) 12px 8px;
  }

  .wz__top-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 40px;
  }

  .wz__top-btn {
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .wz__top-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--ring);
  }

  .wz__top-title {
    flex: 1;
    min-width: 0;
    font-size: 17px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wz__top-count {
    padding-right: 8px;
    font-size: 14px;
    color: var(--text3);
  }

  .wz__progress {
    display: flex;
    gap: 4px;
    padding: 8px 8px 0;
  }

  .wz__bar {
    flex: 1;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--muted);
  }

  .wz__bar--on {
    background: var(--primary);
  }

  .wz__bar--error {
    background: var(--danger);
  }

  .wz__body,
  .wz__body--wide {
    display: block;
    padding: 0 0 calc(96px + env(safe-area-inset-bottom));
  }

  .wz__main {
    gap: 0;
  }

  .wz__notes {
    padding: 12px 16px 0;
  }

  .wz__notes:empty {
    display: none;
  }

  .wz__card {
    border-radius: 0;
    padding: 20px 16px 24px;
    gap: 20px;
  }

  .wz__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-header);
    border-radius: 0;
    border-top: 1px solid var(--border);
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  }

  .wz__hints--phone {
    margin: 0 16px 16px;
  }
}
</style>
