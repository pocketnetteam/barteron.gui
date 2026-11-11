<script setup lang="ts">
import type { IconName } from '@/ui/icons'
import UiIcon from '@/ui/UiIcon.vue'

export interface SystemNote {
  /** `true` — still works (green dot), `false` — what waits (amber dot). */
  ok: boolean
  text: string
}

/**
 * A system screen (s8-system-desktop): the cause in a circle, a title, what
 * happened and what is still there, one main action. Most failures are not
 * ours (the node, the Bastyon version, permissions), so each says why.
 * `bare` drops the card, for a sheet or a page of its own.
 */
withDefaults(
  defineProps<{
    title: string
    text?: string
    icon?: IconName
    /** A few characters instead of an icon: «404», «₽». */
    glyph?: string
    tone?: 'neutral' | 'primary' | 'danger' | 'info' | 'warning' | 'success'
    notes?: SystemNote[]
    bare?: boolean
    /** For e2e: which screen this is. */
    kind?: string
  }>(),
  {
    tone: 'neutral',
    notes: () => [],
    bare: false,
    text: undefined,
    icon: undefined,
    glyph: undefined,
  }
)
</script>

<template>
  <section
    class="sys"
    :class="{ 'sys--bare': bare }"
    role="status"
    data-testid="system-state"
    :data-kind="kind"
  >
    <span v-if="icon || glyph" class="sys__mark" :class="`sys__mark--${tone}`" aria-hidden="true">
      <UiIcon v-if="icon" :name="icon" :size="28" :stroke="2" />
      <template v-else>{{ glyph }}</template>
    </span>
    <h2 class="sys__title">{{ title }}</h2>
    <p v-if="text" class="sys__text">{{ text }}</p>
    <ul v-if="notes.length" class="sys__notes">
      <li v-for="note in notes" :key="note.text" class="sys__note">
        <span class="sys__dot" :class="{ 'sys__dot--wait': !note.ok }" />{{ note.text }}
      </li>
    </ul>
    <div v-if="$slots.default" class="sys__actions"><slot /></div>
  </section>
</template>

<style scoped>
.sys {
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 32px 24px 24px;
  border-radius: 18px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.sys--bare {
  max-width: 440px;
  padding: 8px 0 0;
  background: none;
}

.sys__mark {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  background: var(--muted);
  color: var(--text2);
}

.sys__mark--primary {
  background: var(--primary-soft);
  color: var(--link);
}

.sys__mark--danger {
  background: var(--danger-soft);
  color: var(--danger);
}

.sys__mark--info {
  background: var(--info-soft);
  color: var(--info);
}

.sys__mark--warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.sys__mark--success {
  background: var(--success-soft);
  color: var(--success);
}

.sys__title {
  margin: 0;
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
  /* A dialog's body is grey by default. */
  color: var(--text);
}

.sys__text {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.sys__notes {
  align-self: stretch;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sys__note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--subtle);
  box-shadow: inset 0 0 0 1px var(--border);
  font-size: 13px;
  line-height: 18px;
  color: var(--text);
  text-align: left;
}

.sys__dot {
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: var(--radius-full);
  background: var(--success);
}

.sys__dot--wait {
  background: var(--warning);
}

.sys__actions {
  align-self: stretch;
  padding-top: 6px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
</style>
