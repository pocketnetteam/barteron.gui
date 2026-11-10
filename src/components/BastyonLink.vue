<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * A link that leaves Barteron for Bastyon: chat, wallet, profile
 * (principle 05: going to Bastyon is always marked with ↗).
 */
withDefaults(defineProps<{ tone?: 'link' | 'plain' }>(), { tone: 'link' })
defineEmits<{ open: [] }>()
const { t } = useI18n()
</script>

<template>
  <button type="button" class="bl" :class="`bl--${tone}`" @click="$emit('open')">
    <slot />
    <UiIcon class="bl__icon" name="external" :size="14" :stroke="2" />
    <span class="visually-hidden">{{ t('ui.opensInBastyon') }}</span>
  </button>
</template>

<style scoped>
.bl {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: inherit;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-align: left;
}

.bl--plain {
  color: var(--text);
  font-weight: inherit;
}

.bl--plain .bl__icon {
  color: var(--text3);
}

.bl:hover {
  text-decoration: underline;
}

.bl:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
