<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppLogo from '@/components/layout/AppLogo.vue'
import UiButton from '@/ui/UiButton.vue'

/** Header of «О проекте» and «Полезные советы» (s8-about-desktop, s8-help-desktop). */
const { t } = useI18n()
</script>

<template>
  <header class="ih">
    <div class="container ih__inner">
      <AppLogo />
      <nav class="ih__nav" :aria-label="t('info.nav')">
        <RouterLink class="ih__link" :to="{ name: 'about' }" exact-active-class="ih__link--on">{{
          t('info.about')
        }}</RouterLink>
        <RouterLink class="ih__link" :to="{ name: 'tips' }" exact-active-class="ih__link--on">{{
          t('info.tips')
        }}</RouterLink>
      </nav>
      <span class="ih__gap" />
      <UiButton :to="{ name: 'createBarter' }">{{ t('header.create') }}</UiButton>
    </div>
  </header>
</template>

<style scoped>
.ih {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.ih__inner {
  padding-top: 14px;
  padding-bottom: 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}

.ih__nav {
  margin-left: 16px;
  display: flex;
  gap: 20px;
}

.ih__link {
  color: var(--text2);
  font-size: 15px;
  line-height: 20px;
  text-decoration: none;
}

.ih__link:hover {
  color: var(--text);
  text-decoration: none;
}

.ih__link--on {
  color: var(--text);
  font-weight: 600;
}

.ih__link:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}

.ih__gap {
  flex: 1;
}
</style>
