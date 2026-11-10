<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiIcon from '@/ui/UiIcon.vue'

/** Heart: `photo` — white circle on top of a photo; `plain` — in a list row. */
withDefaults(defineProps<{ active?: boolean; variant?: 'photo' | 'plain' }>(), {
  active: false,
  variant: 'photo',
})
defineEmits<{ toggle: [] }>()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="fav"
    :class="[`fav--${variant}`, { 'fav--active': active }]"
    :aria-pressed="active"
    :aria-label="active ? t('offer.favoriteRemove') : t('offer.favoriteAdd')"
    @click.stop.prevent="$emit('toggle')"
  >
    <UiIcon :name="active ? 'heart-filled' : 'heart'" :size="variant === 'photo' ? 20 : 22" />
  </button>
</template>

<style scoped>
.fav {
  position: relative;
  z-index: 1;
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--duration);
}

.fav:active {
  transform: scale(0.92);
}

.fav:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.fav--photo {
  background: var(--on-photo-button);
  color: #16161d;
}

.fav--plain {
  background: transparent;
  color: var(--text2);
}

.fav--plain:hover {
  background: var(--muted);
}

.fav--active {
  color: var(--favorite);
}
</style>
