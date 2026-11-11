<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LEGAL_DOCS, useOpenDoc } from '@/composables/docs'
import { useUiStore, type AppDialog } from '@/stores/ui'

/**
 * Footer (s8-about-desktop): Barteron, «Участникам», legal documents. The
 * documents are the old app's files at the same paths (`/docs/ru-RU/…`), in
 * Russian only, as before.
 */
const { t, locale } = useI18n()
const ui = useUiStore()
const openDoc = useOpenDoc()

const forMembers: { key: AppDialog; label: string }[] = [
  { key: 'referral', label: 'footer.referral' },
  { key: 'survey', label: 'footer.survey' },
  { key: 'support', label: 'footer.support' },
]
</script>

<template>
  <footer class="footer" data-testid="footer">
    <div class="container footer__inner">
      <div class="footer__brand-col">
        <strong class="footer__brand">barteron</strong>
        <p class="footer__about">{{ t('footer.about') }}</p>
      </div>
      <nav class="footer__col" :aria-label="t('footer.label')">
        <span class="footer__head">Barteron</span>
        <RouterLink class="footer__link" :to="{ name: 'about' }">{{
          t('footer.project')
        }}</RouterLink>
        <RouterLink class="footer__link" :to="{ name: 'tips' }">{{ t('footer.tips') }}</RouterLink>
      </nav>
      <nav class="footer__col" :aria-label="t('footer.members')">
        <span class="footer__head">{{ t('footer.members') }}</span>
        <button
          v-for="item in forMembers"
          :key="item.key"
          type="button"
          class="footer__link"
          :data-testid="`footer-${item.key}`"
          @click="ui.openDialog(item.key)"
        >
          {{ t(item.label) }}
        </button>
      </nav>
      <nav class="footer__col" :aria-label="t('legal.title')">
        <span class="footer__head">{{ t('legal.title') }}</span>
        <button
          v-for="doc in LEGAL_DOCS"
          :key="doc.key"
          type="button"
          class="footer__link"
          @click="openDoc(doc.file)"
        >
          {{ t(`footer.${doc.key}`)
          }}<span v-if="locale !== 'ru'" class="footer__lang" :title="t('legal.inRussian')"
            >RU</span
          >
        </button>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 48px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.footer__inner {
  padding-top: 32px;
  padding-bottom: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px 48px;
}

.footer__brand-col {
  flex: 1 1 240px;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  line-height: 18px;
  color: var(--text3);
}

.footer__col {
  flex: 0 1 200px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.footer__head {
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
  color: var(--text2);
}

.footer__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: 400 14px / 20px var(--font-sans);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.footer__link:hover {
  color: var(--link);
  text-decoration: none;
}

.footer__lang {
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 4px;
  background: var(--muted);
  color: var(--text2);
  font-size: 11px;
  font-weight: 600;
}

.footer__link:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
