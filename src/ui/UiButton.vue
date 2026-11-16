<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { IconName } from './icons'
import UiIcon from './UiIcon.vue'
import UiSpinner from './UiSpinner.vue'

export type ButtonVariant =
  | 'primary'
  | 'contrast'
  | 'secondary'
  | 'neutral'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-text'
  | 'pkoin'
  /** On a danger-soft banner: white button, red text. */
  | 'on-danger'

/** Heights in px. The sheet names 48 / 40 / 32 as L / M / S; screens also use 52, 44 and 36. */
export type ButtonSize = 32 | 36 | 40 | 44 | 48 | 52

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    icon?: IconName
    iconRight?: IconName
    /** Opens something in Bastyon (chat, wallet, profile): adds ↗ and a hint for screen readers. */
    external?: boolean
    /** Accessible name; required for icon-only buttons. */
    label?: string
    loading?: boolean
    disabled?: boolean
    block?: boolean
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit' | 'reset'
    /** Submits the form with this id from outside it. */
    form?: string
  }>(),
  { variant: 'primary', size: 44, type: 'button' }
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const slots = useSlots()
const { t } = useI18n()

const iconOnly = computed(() => !slots.default && !!props.icon)
const iconSize = computed(() => (props.size >= 40 ? 20 : 16))
const inactive = computed(() => props.disabled || props.loading)

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))

const attrs = computed(() => {
  if (props.to) {
    return { to: props.to, 'aria-disabled': inactive.value || undefined }
  }
  if (props.href) {
    return { href: props.href, 'aria-disabled': inactive.value || undefined }
  }
  return { type: props.type, form: props.form, disabled: inactive.value }
})
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    class="ui-button"
    :class="[
      `ui-button--${variant}`,
      `ui-button--h${size}`,
      {
        'ui-button--icon-only': iconOnly,
        'ui-button--block': block,
        'ui-button--loading': loading,
        'ui-button--disabled': disabled,
      },
    ]"
    :aria-label="label"
    :aria-busy="loading || undefined"
    @click="emit('click', $event)"
  >
    <UiSpinner v-if="loading" :size="iconSize - 2" />
    <UiIcon v-else-if="icon" :name="icon" :size="iconSize" :stroke="2" />
    <slot />
    <UiIcon v-if="iconRight" :name="iconRight" :size="16" :stroke="2" />
    <template v-if="external">
      <UiIcon name="external" :size="16" :stroke="2" />
      <span class="visually-hidden">{{ t('ui.opensInBastyon') }}</span>
    </template>
  </component>
</template>

<style scoped>
.ui-button {
  --h: 44px;
  --pad: 18px;
  --fs: 15px;
  --r: var(--radius-m);
  --bg: var(--primary);
  --bg-hover: var(--primary-hover);
  --fg: #ffffff;

  box-sizing: border-box;
  height: var(--h);
  padding: 0 var(--pad);
  border: 0;
  border-radius: var(--r);
  background: var(--bg);
  color: var(--fg);
  font: 600 var(--fs) / 1 var(--font-sans);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--duration),
    box-shadow var(--duration),
    border-color var(--duration);
  -webkit-tap-highlight-color: transparent;
}

.ui-button:hover {
  background: var(--bg-hover);
  text-decoration: none;
}

.ui-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

/* Sizes */
.ui-button--h52 {
  --h: 52px;
  --pad: 20px;
  --fs: 16px;
}
.ui-button--h48 {
  --h: 48px;
  --pad: 20px;
  --fs: 16px;
}
.ui-button--h44 {
  --h: 44px;
  --pad: 18px;
  --fs: 15px;
}
.ui-button--h40 {
  --h: 40px;
  --pad: 16px;
  --fs: 14px;
}
.ui-button--h36 {
  --h: 36px;
  --pad: 12px;
  --fs: 13px;
  --r: 10px;
  gap: 6px;
}
.ui-button--h32 {
  --h: 32px;
  --pad: 12px;
  --fs: 13px;
  --r: var(--radius-s);
  gap: 6px;
}

.ui-button--icon-only {
  width: var(--h);
  padding: 0;
}

.ui-button--block {
  display: flex;
  width: 100%;
}

/* Variants */
.ui-button--contrast {
  --bg: var(--contrast);
  --bg-hover: var(--contrast);
  --fg: var(--on-contrast);
}
.ui-button--contrast:hover {
  opacity: 0.9;
}
.ui-button--secondary {
  --bg: var(--primary-soft);
  --bg-hover: var(--primary-soft-hover);
  --fg: var(--link);
}
.ui-button--neutral {
  --bg: var(--muted);
  --bg-hover: var(--muted-hover);
  --fg: var(--text);
}
.ui-button--outline {
  --bg: transparent;
  --bg-hover: transparent;
  --fg: var(--text);
  border: 1.5px solid var(--border-strong);
}
.ui-button--outline:hover {
  border-color: var(--text3);
}
.ui-button--outline:focus-visible {
  border: 2px solid var(--primary);
}
.ui-button--ghost {
  --bg: transparent;
  --bg-hover: var(--primary-soft);
  --fg: var(--link);
  --pad: 12px;
  gap: 6px;
}
.ui-button--ghost.ui-button--h32,
.ui-button--ghost.ui-button--h36 {
  --pad: 8px;
}
.ui-button--danger {
  --bg: var(--danger-soft);
  --bg-hover: var(--danger-soft);
  --fg: var(--danger);
}
.ui-button--danger:hover {
  filter: brightness(0.97);
}
.ui-button--danger-text {
  --bg: transparent;
  --bg-hover: var(--danger-soft);
  --fg: var(--danger);
}
.ui-button--pkoin {
  --bg: var(--pkoin-soft);
  --bg-hover: var(--pkoin-soft);
  --fg: var(--pkoin);
}
.ui-button--pkoin:hover {
  filter: brightness(0.97);
}
.ui-button--on-danger {
  --bg: var(--surface);
  --bg-hover: var(--subtle);
  --fg: var(--danger);
}
.ui-button--icon-only.ui-button--ghost {
  --fg: var(--text2);
  --bg-hover: var(--muted);
}

/* States */
.ui-button:disabled:not(.ui-button--loading),
.ui-button--disabled {
  --bg: var(--disabled-bg);
  --bg-hover: var(--disabled-bg);
  --fg: var(--disabled-fg);
  border-color: transparent;
  cursor: not-allowed;
  opacity: 1;
  filter: none;
}
.ui-button--ghost.ui-button--disabled,
.ui-button--ghost:disabled:not(.ui-button--loading),
.ui-button--danger-text.ui-button--disabled,
.ui-button--danger-text:disabled:not(.ui-button--loading) {
  --bg: transparent;
  --bg-hover: transparent;
}
.ui-button--loading {
  opacity: 0.85;
  cursor: progress;
}
.ui-button--loading:hover {
  background: var(--bg);
}
a.ui-button[aria-disabled='true'] {
  pointer-events: none;
}
</style>
