<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import InfoHeader from '@/components/info/InfoHeader.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import { useSupport } from '@/composables/support'
import { useUiStore } from '@/stores/ui'
import type { IconName } from '@/ui/icons'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «О проекте» (s8-about-desktop), on the old path `/about`: what Barteron is,
 * how it differs, the ways to agree, questions, and support.
 */
const { t } = useI18n()
const ui = useUiStore()
const support = useSupport()

const TILES: { key: string; icon: IconName }[] = [
  { key: 'chain', icon: 'tiles' },
  { key: 'chats', icon: 'chat' },
  { key: 'pkoin', icon: 'pkoin' },
  { key: 'match', icon: 'exchange' },
]
const DIFFERENCES = ['owner', 'money', 'data'] as const
const WAYS: { key: string; icon: IconName; tone: string }[] = [
  { key: 'direct', icon: 'exchange', tone: 'primary' },
  { key: 'chain', icon: 'link', tone: 'primary' },
  { key: 'buy', icon: 'pkoin', tone: 'pkoin' },
  { key: 'safe', icon: 'shield', tone: 'success' },
  { key: 'point', icon: 'pickup-point', tone: 'info' },
]
const QUESTIONS = ['safe', 'fee', 'delay', 'lowScore', 'favorites'] as const
const openQuestion = ref<string | null>('safe')

const how = ref<HTMLElement>()
const showHow = () => how.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
</script>

<template>
  <AppLayout tab="profile">
    <template #header><InfoHeader /></template>
    <template #mobile-top>
      <PageTopBar :title="t('info.about')" :back="{ name: 'home' }" />
    </template>

    <div class="about container" data-testid="about-page">
      <section class="about__hero">
        <div class="about__intro">
          <span class="about__badge">{{ t('about.badge') }}</span>
          <h1 class="about__title">{{ t('about.title') }}</h1>
          <p class="about__lead">{{ t('about.lead') }}</p>
          <div class="about__cta">
            <UiButton :size="52" :to="{ name: 'createBarter' }">{{ t('header.create') }}</UiButton>
            <UiButton :size="52" variant="outline" @click="showHow">{{ t('about.how') }}</UiButton>
          </div>
        </div>
        <div class="about__tiles" aria-hidden="true">
          <div
            v-for="tile in TILES"
            :key="tile.key"
            class="about__tile"
            :class="`about__tile--${tile.key}`"
          >
            <UiIcon :name="tile.icon" :size="32" :stroke="1.8" />
            <span>{{ t(`about.tiles.${tile.key}`) }}</span>
          </div>
        </div>
      </section>

      <section ref="how" class="about__section">
        <h2 class="about__h2">{{ t('about.differs') }}</h2>
        <div class="about__grid about__grid--wide">
          <article v-for="key in DIFFERENCES" :key="key" class="about__card">
            <span class="about__card-title">{{ t(`about.diff.${key}.title`) }}</span>
            <span class="about__card-text">{{ t(`about.diff.${key}.text`) }}</span>
            <span class="about__card-note">{{ t(`about.diff.${key}.note`) }}</span>
          </article>
        </div>
      </section>

      <section class="about__section">
        <h2 class="about__h2">{{ t('about.ways') }}</h2>
        <div class="about__grid">
          <article v-for="way in WAYS" :key="way.key" class="about__way">
            <span class="about__way-icon" :class="`about__way-icon--${way.tone}`">
              <UiIcon :name="way.icon" :size="22" :stroke="1.8" />
            </span>
            <span class="about__way-title">{{ t(`about.way.${way.key}.title`) }}</span>
            <span class="about__way-text">{{ t(`about.way.${way.key}.text`) }}</span>
          </article>
        </div>
      </section>

      <section class="about__bottom">
        <div class="about__faq">
          <h2 class="about__h2">{{ t('about.faq') }}</h2>
          <div v-for="key in QUESTIONS" :key="key" class="about__q" :data-question="key">
            <button
              type="button"
              class="about__q-head"
              :aria-expanded="openQuestion === key"
              @click="openQuestion = openQuestion === key ? null : key"
            >
              {{ t(`about.q.${key}.q`) }}
              <UiIcon
                :name="openQuestion === key ? 'minus' : 'plus'"
                :size="18"
                class="about__q-sign"
              />
            </button>
            <div v-if="openQuestion === key" class="about__q-body">
              <p>{{ t(`about.q.${key}.a`) }}</p>
              <button
                v-if="key === 'safe'"
                type="button"
                class="about__link"
                @click="ui.openSafeDealHelp()"
              >
                {{ t('settings.links.safeDeal') }}
              </button>
            </div>
          </div>
        </div>

        <aside class="about__aside">
          <section class="about__side">
            <span class="about__side-title">{{ t('about.support.title') }}</span>
            <span class="about__side-text">{{ t('about.support.text') }}</span>
            <UiButton
              variant="contrast"
              block
              data-testid="about-support"
              @click="ui.openDialog('support')"
              >{{ t('support.title') }}</UiButton
            >
            <UiButton variant="ghost" block :size="40" @click="support.copyEmail()">{{
              t('about.support.copy')
            }}</UiButton>
          </section>
          <section class="about__side about__side--pkoin">
            <span class="about__side-title">{{ t('referral.promo') }}</span>
            <span class="about__side-text">{{ t('about.referralText') }}</span>
            <button type="button" class="about__link" @click="ui.openDialog('referral')">
              {{ t('referral.title') }}
            </button>
          </section>
          <section class="about__side">
            <span class="about__side-title">{{ t('survey.invite') }}</span>
            <span class="about__side-text">{{ t('survey.inviteText') }}</span>
            <button
              type="button"
              class="about__link"
              data-testid="about-survey"
              @click="ui.openDialog('survey')"
            >
              {{ t('survey.take') }}
            </button>
          </section>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.about {
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.about__hero {
  padding: 40px;
  border-radius: 28px;
  background: var(--surface);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 32px;
}

.about__intro {
  flex: 1 1 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.about__badge {
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: var(--primary-soft);
  color: var(--link);
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
}

.about__title {
  margin: 0;
  font-size: 44px;
  line-height: 52px;
  font-weight: 800;
  letter-spacing: -1px;
}

.about__lead {
  margin: 0;
  font-size: 18px;
  line-height: 28px;
  color: var(--text2);
}

.about__cta {
  padding-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.about__tiles {
  flex: 1 1 360px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.about__tile {
  aspect-ratio: 1 / 1;
  padding: 20px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
}

.about__tile--chain {
  background: var(--primary);
  /* White on the brand colour in both themes, like the primary button. */
  color: #ffffff;
}

.about__tile--chats {
  background: var(--muted);
  color: var(--text);
}

.about__tile--pkoin {
  background: var(--pkoin-soft);
  color: var(--pkoin);
}

.about__tile--match {
  background: var(--contrast);
  color: var(--on-contrast);
}

.about__section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  scroll-margin-top: 24px;
}

.about__h2 {
  margin: 0;
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
}

.about__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 16px;
}

.about__grid--wide {
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
}

.about__card {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.about__card-title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.about__card-text {
  font-size: 15px;
  line-height: 22px;
  color: var(--text2);
}

.about__card-note {
  padding-top: 6px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.about__way {
  padding: 20px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.about__way-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-soft);
  color: var(--link);
}

.about__way-icon--pkoin {
  background: var(--pkoin-soft);
  color: var(--pkoin);
}

.about__way-icon--success {
  background: var(--success-soft);
  color: var(--success);
}

.about__way-icon--info {
  background: var(--info-soft);
  color: var(--info);
}

.about__way-title {
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
}

.about__way-text {
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.about__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 24px;
}

.about__faq {
  flex: 1 1 520px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.about__faq .about__h2 {
  margin-bottom: 8px;
}

.about__q {
  border-radius: 16px;
  background: var(--surface);
}

.about__q-head {
  width: 100%;
  padding: 18px 20px;
  border: 0;
  border-radius: 16px;
  background: none;
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  text-align: left;
  font: 600 16px / 22px var(--font-sans);
  cursor: pointer;
}

.about__q-head:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.about__q-sign {
  flex: none;
  color: var(--text3);
}

.about__q-body {
  padding: 0 20px 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.about__q-body p {
  margin: -8px 0 0;
  font-size: 15px;
  line-height: 22px;
  color: var(--text2);
}

.about__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
  text-align: left;
  cursor: pointer;
}

.about__link:hover {
  text-decoration: underline;
}

.about__link:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}

.about__aside {
  flex: 1 1 300px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.about__side {
  padding: 20px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.about__side--pkoin {
  background: var(--pkoin-soft);
}

.about__side-title {
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
}

.about__side-text {
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

@media (max-width: 767px) {
  .about {
    padding-top: 16px;
    gap: 28px;
  }

  .about__hero {
    padding: 24px 20px;
    border-radius: 24px;
    gap: 24px;
  }

  .about__intro,
  .about__tiles {
    flex-basis: 100%;
  }

  .about__title {
    font-size: 30px;
    line-height: 36px;
    letter-spacing: -0.5px;
  }

  .about__lead {
    font-size: 16px;
    line-height: 24px;
  }

  .about__cta > * {
    flex: 1 1 100%;
  }

  .about__tile {
    aspect-ratio: auto;
    min-height: 112px;
    padding: 16px;
    font-size: 15px;
    line-height: 20px;
  }

  .about__h2 {
    font-size: 22px;
    line-height: 28px;
  }

  .about__faq,
  .about__aside {
    flex-basis: 100%;
    max-width: none;
  }
}
</style>
