<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IconName } from '@/ui/icons'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * Hints under the categories (s2-home): notifications, safe deal, tips — the
 * old sticker list. Their dialogs arrive in later stages.
 */
defineEmits<{ action: [key: 'notifications' | 'safeDeal' | 'tips'] }>()
const { t } = useI18n()

const BANNERS: { key: 'notifications' | 'safeDeal' | 'tips'; icon: IconName; tone: string }[] = [
  { key: 'notifications', icon: 'bell', tone: 'info' },
  { key: 'safeDeal', icon: 'safe-deal', tone: 'success' },
  { key: 'tips', icon: 'tip', tone: 'primary' },
]
</script>

<template>
  <section class="banners" :aria-label="t('home.hints')">
    <div v-for="b in BANNERS" :key="b.key" class="banner" :class="`banner--${b.tone}`">
      <span class="banner__icon"><UiIcon :name="b.icon" :size="22" /></span>
      <div class="banner__body">
        <span class="banner__text">{{ t(`banners.${b.key}.text`) }}</span>
        <button type="button" class="banner__action" @click="$emit('action', b.key)">
          {{ t(`banners.${b.key}.action`) }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.banners {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 12px;
}

.banner {
  padding: 20px;
  border-radius: var(--radius-l);
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.banner--info {
  background: var(--info-soft);
  --icon: var(--info);
}

.banner--success {
  background: var(--success-soft);
  --icon: var(--success);
}

.banner--primary {
  background: var(--primary-soft);
  --icon: var(--link);
}

.banner__icon {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-m);
  background: var(--surface);
  color: var(--icon);
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.banner__text {
  font-size: 15px;
  line-height: 21px;
}

.banner__action {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.banner__action:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}

/* Phone: a row that scrolls sideways. */
@media (max-width: 767px) {
  .banners {
    display: flex;
    gap: 10px;
    margin: 0 -16px;
    padding: 0 16px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .banners::-webkit-scrollbar {
    display: none;
  }

  .banner {
    flex: none;
    width: 300px;
    padding: 16px;
    gap: 12px;
    scroll-snap-align: start;
  }

  .banner__icon {
    width: 40px;
    height: 40px;
  }

  .banner__text {
    font-size: 14px;
    line-height: 19px;
  }
}
</style>
