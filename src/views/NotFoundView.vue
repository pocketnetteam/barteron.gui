<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import SystemState from '@/components/system/SystemState.vue'
import { categoryRoute } from '@/composables/catalog-nav'
import { useUiStore } from '@/stores/ui'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Такой страницы нет» (s8-system-desktop, s8-404-mobile): an unknown path,
 * `/404`, or a link to something the node no longer has. The offer may have
 * been published again, so search is the second way out.
 */
const { t } = useI18n()
const ui = useUiStore()

/** «Популярные категории» on the phone: three of the home tiles. */
const POPULAR = [
  { id: 7000, key: 'electronics' },
  { id: 6000, key: 'transport' },
  { id: 2, key: 'services' },
] as const
</script>

<template>
  <AppLayout tab="search">
    <template #mobile-top>
      <div class="nf-top">
        <button type="button" class="nf-top__search" @click="ui.openSearch()">
          <UiIcon name="search" :size="20" />{{ t('header.searchPlaceholder') }}
        </button>
      </div>
    </template>

    <div class="nf container" data-testid="not-found">
      <SystemState
        class="nf__card"
        kind="404"
        glyph="404"
        :title="t('notFound.title')"
        :text="t('notFound.text')"
      >
        <UiButton :to="{ name: 'home' }" data-testid="not-found-home">{{
          t('notFound.home')
        }}</UiButton>
        <UiButton variant="ghost" :to="categoryRoute(null)">{{ t('notFound.search') }}</UiButton>
      </SystemState>

      <!-- Phone (s8-404-mobile): a big 404, home, and popular categories. -->
      <div class="nf__phone">
        <span class="nf__big" aria-hidden="true">404</span>
        <h1 class="nf__title">{{ t('notFound.title') }}</h1>
        <p class="nf__text">{{ t('notFound.textPhone') }}</p>
        <UiButton block :size="52" :to="{ name: 'home' }">{{ t('notFound.home') }}</UiButton>
        <span class="nf__popular">{{ t('notFound.popular') }}</span>
        <div class="nf__chips">
          <RouterLink v-for="c in POPULAR" :key="c.id" class="nf__chip" :to="categoryRoute(c.id)">{{
            t(`tiles.${c.key}.short`)
          }}</RouterLink>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.nf {
  padding-top: 64px;
  padding-bottom: 32px;
}

.nf__phone {
  display: none;
}

.nf-top {
  padding: 10px max(16px, var(--host-corner, 0px)) 10px 16px;
  background: var(--surface);
}

.nf-top__search {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 12px;
  background: var(--muted);
  color: var(--text3);
  display: flex;
  align-items: center;
  gap: 10px;
  font: 400 15px / 20px var(--font-sans);
  cursor: pointer;
}

@media (max-width: 767px) {
  .nf {
    padding-top: 40px;
  }

  .nf__card {
    display: none;
  }

  .nf__phone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  .nf__big {
    font-size: 88px;
    line-height: 96px;
    font-weight: 800;
    letter-spacing: -2px;
    color: var(--primary);
  }

  .nf__title {
    margin: 0;
    font-size: 22px;
    line-height: 28px;
    font-weight: 700;
  }

  .nf__text {
    margin: 0 0 12px;
    font-size: 15px;
    line-height: 22px;
    color: var(--text2);
  }

  .nf__popular {
    margin-top: 28px;
    font-size: 13px;
    line-height: 18px;
    font-weight: 600;
    color: var(--text2);
  }

  .nf__chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .nf__chip {
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    background: var(--surface);
    color: var(--text);
    font-size: 14px;
    line-height: 20px;
    text-decoration: none;
  }
}
</style>
