<script setup lang="ts">
import UiIcon from '@/ui/UiIcon.vue'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <RouterLink :to="{ name: 'home' }" class="logo" aria-label="Barteron">
    <span class="logo__mark"><UiIcon name="exchange" :size="22" :stroke="2.2" /></span>
    <span v-if="!compact" class="logo__word" aria-hidden="true">barteron</span>
  </RouterLink>
</template>

<style scoped>
.logo {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  text-decoration: none;
  border-radius: 10px;
}

.logo:hover {
  text-decoration: none;
}

.logo:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.logo__mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo__word {
  font-size: 22px;
  line-height: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
</style>
