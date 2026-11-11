<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import InfoHeader from '@/components/info/InfoHeader.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import { categoryRoute } from '@/composables/catalog-nav'
import { searchTips, tipItemKeys, TIPS, type TipLink, type TipSection } from '@/models/tips'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Полезные советы» (s8-help-desktop) on a new path, `/help`: the old app
 * showed them in a window. Sections on the left (on a phone, chips on top),
 * the chosen one in the hash, search across all of them, and links to the
 * screens the advice is about.
 */
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const ui = useUiStore()

const current = computed<TipSection>(() => TIPS.find((s) => `#${s.key}` === route.hash) ?? TIPS[0]!)
const query = ref('')
const results = computed(() => searchTips(query.value, (key) => t(key), locale.value))
const searching = computed(() => !!query.value.trim())

function choose(section: TipSection) {
  query.value = ''
  void router.replace({ hash: section.key === 'create' ? '' : `#${section.key}` })
}

const me = computed(() => session.address)
const cabinet = (hash: string): RouteLocationRaw | null =>
  me.value ? { name: 'profile', params: { id: me.value }, hash } : null

function follow(link: TipLink) {
  const routes: Partial<Record<TipLink, RouteLocationRaw | null>> = {
    createExchange: { name: 'createBarter', query: { step: '3' } },
    createPlace: { name: 'createBarter', query: { step: '4' } },
    map: { name: 'categoryMap', params: { id: 'search' } },
    notifications: cabinet('#notifications'),
    barters: cabinet('#barters'),
  }
  if (link === 'safeDealHelp') ui.openSafeDealHelp()
  else if (link === 'location') ui.openLocation()
  else if (link in routes) {
    const to = routes[link]
    if (to) void router.push(to)
    else void session.ensureSignedIn()
  }
}

const shown = computed(() =>
  searching.value ? results.value : [{ section: current.value, chapters: current.value.chapters }]
)
const catalog = categoryRoute(null)
</script>

<template>
  <AppLayout tab="profile">
    <template #header><InfoHeader /></template>
    <template #mobile-top>
      <PageTopBar :title="t('info.tips')" :back="{ name: 'home' }" />
    </template>

    <div class="tips container" data-testid="tips-page">
      <div class="tips__head">
        <h1 class="tips__title">{{ t('info.tips') }}</h1>
        <label class="tips__search">
          <UiIcon name="search" :size="20" class="tips__search-icon" />
          <span class="visually-hidden">{{ t('tips.find') }}</span>
          <input
            v-model="query"
            class="tips__input"
            type="search"
            autocomplete="off"
            :placeholder="t('tips.find')"
            data-testid="tips-search"
          />
        </label>
      </div>

      <div class="tips__body">
        <nav class="tips__nav" :aria-label="t('info.tips')">
          <button
            v-for="section in TIPS"
            :key="section.key"
            type="button"
            class="tips__section"
            :class="{ 'tips__section--on': !searching && section.key === current.key }"
            :aria-current="!searching && section.key === current.key ? 'true' : undefined"
            :data-section="section.key"
            @click="choose(section)"
          >
            <span class="tips__section-title">{{ t(`tips.${section.key}.title`) }}</span>
            <span class="tips__section-short">{{ t(`tips.${section.key}.short`) }}</span>
            <span class="tips__section-meta">{{ t(`tips.${section.key}.meta`) }}</span>
          </button>
        </nav>

        <div class="tips__content">
          <UiEmptyState
            v-if="searching && !results.length"
            icon="search-empty"
            :title="t('tips.nothing')"
            :text="t('tips.nothingText')"
            data-testid="tips-nothing"
          >
            <RouterLink class="tips__link" :to="catalog">{{ t('notFound.search') }}</RouterLink>
          </UiEmptyState>

          <section v-for="group in shown" :key="group.section.key" class="tips__group">
            <h2 class="tips__h2">{{ t(`tips.${group.section.key}.title`) }}</h2>
            <div class="tips__grid">
              <article
                v-for="chapter in group.chapters"
                :key="chapter.key"
                class="tips__card"
                data-testid="tip"
              >
                <h3 class="tips__card-title">
                  <span class="tips__num">{{ group.section.chapters.indexOf(chapter) + 1 }}</span>
                  {{ t(`tips.${group.section.key}.${chapter.key}.title`) }}
                </h3>
                <ul class="tips__items">
                  <li v-for="key in tipItemKeys(group.section.key, chapter)" :key="key">
                    {{ t(key) }}
                  </li>
                </ul>
                <button
                  v-if="chapter.link"
                  type="button"
                  class="tips__link"
                  :data-link="chapter.link"
                  @click="follow(chapter.link)"
                >
                  {{ t(`tips.link.${chapter.link}`) }}
                </button>
              </article>
            </div>
          </section>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.tips {
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tips__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
}

.tips__title {
  margin: 0;
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
}

.tips__search {
  flex: 0 1 448px;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 10px;
}

.tips__search:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.tips__search-icon {
  flex: none;
  color: var(--text2);
}

.tips__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  outline: none;
}

.tips__body {
  display: grid;
  grid-template-columns: 256px minmax(0, 1fr);
  align-items: start;
  gap: 24px;
}

.tips__nav {
  padding: 8px;
  border-radius: 18px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tips__section {
  padding: 12px;
  border: 0;
  border-radius: 12px;
  background: none;
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
  cursor: pointer;
}

.tips__section:hover {
  background: var(--subtle);
}

.tips__section:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--ring);
}

.tips__section--on,
.tips__section--on:hover {
  background: var(--primary-soft);
  color: var(--link);
}

.tips__section-title {
  font-size: 15px;
  line-height: 20px;
}

.tips__section-meta {
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: var(--text3);
}

.tips__section-short {
  display: none;
}

.tips__content {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.tips__group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tips__h2 {
  margin: 0;
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
}

.tips__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}

.tips__card {
  padding: 20px;
  border-radius: 18px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.tips__card-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
}

.tips__num {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--link);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.tips__items {
  margin: 0;
  padding-left: 18px;
  list-style: disc;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.tips__items li::marker {
  color: var(--text3);
}

.tips__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.tips__link:hover {
  text-decoration: underline;
}

.tips__link:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}

@media (max-width: 1023px) {
  .tips__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 767px) {
  .tips {
    padding-top: 16px;
    gap: 16px;
  }

  .tips__title {
    display: none;
  }

  .tips__search {
    flex-basis: 100%;
  }

  .tips__body {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  /* Sections as a row of chips. */
  .tips__nav {
    margin: 0 calc(-1 * var(--page-pad));
    padding: 0 var(--page-pad);
    border-radius: 0;
    background: none;
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tips__section {
    flex: none;
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    background: var(--surface);
  }

  .tips__section--on,
  .tips__section--on:hover {
    border-color: var(--primary);
  }

  .tips__section-short {
    display: block;
    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;
  }

  .tips__section-title,
  .tips__section-meta {
    display: none;
  }

  .tips__card {
    padding: 18px 16px;
  }
}
</style>
