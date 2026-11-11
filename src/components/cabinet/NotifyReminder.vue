<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { cabinetRoute } from '@/composables/cabinet'
import { useNotifyPrefsStore } from '@/stores/notify-prefs'
import { useSessionStore } from '@/stores/session'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Не пропустите покупателя» (s5-states) after publishing, like the old
 * notifications banner: until a channel is connected or «Больше не показывать».
 */
const emit = defineEmits<{ open: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const prefs = useNotifyPrefsStore()
</script>

<template>
  <div v-if="prefs.showReminder" class="nrem" data-testid="notify-reminder">
    <div class="nrem__head">
      <span class="nrem__icon"><UiIcon name="bell" :size="20" /></span>
      <div class="nrem__text">
        <span class="nrem__title">{{ t('notify.reminder.title') }}</span>
        <span class="nrem__sub">{{ t('notify.reminder.text') }}</span>
      </div>
    </div>
    <div class="nrem__actions">
      <UiButton
        :size="40"
        :to="cabinetRoute(session.address, 'notifications')"
        data-testid="notify-reminder-open"
        @click="emit('open')"
        >{{ t('notify.reminder.action') }}</UiButton
      >
      <UiButton
        variant="ghost"
        :size="40"
        data-testid="notify-reminder-off"
        @click="prefs.turnReminderOff()"
        >{{ t('notify.reminder.off') }}</UiButton
      >
    </div>
    <span class="nrem__later">{{ t('notify.reminder.later') }}</span>
  </div>
</template>

<style scoped>
.nrem {
  padding: 20px;
  border: 1px solid var(--info-soft);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-2);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nrem__head {
  display: flex;
  gap: 12px;
}

.nrem__icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-m);
  background: var(--info-soft);
  color: var(--info);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nrem__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nrem__title {
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
}

.nrem__sub,
.nrem__later {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.nrem__later {
  color: var(--text3);
}

.nrem__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
