<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSignPermission } from '@/composables/notify'
import { BASTYON_APPS_URL } from '@/config/roles'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import BotCard from './BotCard.vue'
import SectionHead from './SectionHead.vue'

/**
 * «Уведомления» (s5-notify-desktop / -mobile): replies come to Bastyon chats;
 * device notifications are Bastyon's, Telegram and VK go through p2p.back.
 */
const { t } = useI18n()
const session = useSessionStore()
const sign = useSignPermission()

/** Old app: `browser` — web, `application_electron` — computer, the rest — phone apps. */
const device = computed<'web' | 'desktop' | 'phone'>(() => {
  const d = session.appinfo?.device ?? 'browser'
  if (d === 'browser') return 'web'
  if (d === 'application_electron') return 'desktop'
  return 'phone'
})

function deviceAction() {
  const sdk = session.sdk
  if (!sdk) return
  if (device.value === 'web') void sdk.openExternalLink(BASTYON_APPS_URL).catch(() => undefined)
  else void sdk.helpers.opensettings().catch(() => undefined)
}
</script>

<template>
  <section class="nts" data-testid="cabinet-notifications">
    <SectionHead :title="t('cabinet.sections.notifications')" :text="t('notify.intro')" />

    <div class="nts__card nts__device">
      <span class="nts__icon"
        ><UiIcon :name="device === 'phone' ? 'smartphone' : 'monitor'" :size="22"
      /></span>
      <div class="nts__text">
        <span class="nts__title">{{
          device === 'phone' ? t('notify.device.titlePhone') : t('notify.device.title')
        }}</span>
        <span class="nts__sub">{{ t(`notify.device.${device}`) }}</span>
      </div>
      <UiButton class="nts__action" variant="neutral" :size="44" external @click="deviceAction">{{
        device === 'web' ? t('notify.device.download') : t('notify.device.settings')
      }}</UiButton>
    </div>

    <UiAlert
      v-if="sign.granted.value === false"
      tone="info"
      icon="lock"
      data-testid="notify-signing"
    >
      {{ t('notify.permission') }}
      <template #action>
        <UiButton :size="36" data-testid="notify-allow" @click="sign.request()">{{
          t('notify.allow')
        }}</UiButton>
      </template>
    </UiAlert>
    <div class="nts__card"><BotCard channel="telegram" :signing="sign.granted.value" /></div>
    <div class="nts__card"><BotCard channel="vk" :signing="sign.granted.value" /></div>

    <p class="nts__privacy">
      <UiIcon name="lock" :size="18" />
      <span>{{ t('notify.privacy') }}</span>
    </p>
  </section>
</template>

<style scoped>
.nts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nts__card {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
}

.nts__device {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.nts__icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nts__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nts__title {
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
}

.nts__sub {
  font-size: 13px;
  line-height: 20px;
  color: var(--text2);
}

.nts__privacy {
  margin: 0;
  padding: 14px 20px;
  border-radius: var(--radius-l);
  background: var(--info-soft);
  font-size: 13px;
  line-height: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nts__privacy :deep(svg) {
  flex: none;
  color: var(--info);
}

@media (max-width: 767px) {
  .nts__card {
    padding: 18px;
  }

  .nts__device {
    flex-wrap: wrap;
  }

  .nts__action {
    flex-basis: 100%;
  }
}
</style>
