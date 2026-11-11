<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSoon } from '@/composables/catalog-nav'
import { LEGAL_DOCS, useOpenDoc } from '@/composables/docs'
import { SUPPORT_EMAIL } from '@/config/roles'
import { useSessionStore } from '@/stores/session'

/**
 * Footer (s2-home-desktop). Legal documents are the old app's files at the
 * same paths (`/docs/ru-RU/…`); they exist in Russian only, as before.
 */
const { t, locale } = useI18n()
const session = useSessionStore()
const soon = useSoon()

const docs = computed(() => (locale.value === 'ru' ? LEGAL_DOCS : []))
const openDoc = useOpenDoc()

function support() {
  void session.sdk?.openExternalLink(`mailto:${SUPPORT_EMAIL}`).catch(() => soon())
}
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">
      <strong class="footer__brand">barteron</strong>
      <p class="footer__about">{{ t('footer.about') }}</p>
      <nav class="footer__links" :aria-label="t('footer.label')">
        <RouterLink class="footer__link" :to="{ name: 'about' }">{{
          t('footer.project')
        }}</RouterLink>
        <button
          v-for="doc in docs"
          :key="doc.key"
          type="button"
          class="footer__link"
          @click="openDoc(doc.file)"
        >
          {{ t(`footer.${doc.key}`) }}
        </button>
        <button type="button" class="footer__link" @click="soon">{{ t('footer.survey') }}</button>
        <button type="button" class="footer__link" @click="support">
          {{ t('header.support') }}
        </button>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 48px;
  padding: 36px 0 40px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.footer__inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer__brand {
  font-size: 18px;
  line-height: 24px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.footer__about {
  margin: 0;
  max-width: 420px;
  font-size: 13px;
  line-height: 19px;
  color: var(--text2);
}

.footer__links {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
}

.footer__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text2);
  font: 400 14px / 20px var(--font-sans);
  text-decoration: none;
}

.footer__link:hover {
  color: var(--text);
  text-decoration: none;
}

.footer__link:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
