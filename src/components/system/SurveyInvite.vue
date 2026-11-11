<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSurveyInvite } from '@/composables/survey'
import { useUiStore } from '@/stores/ui'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Помогите улучшить Barteron» on the home page (s8-dialogs): the old survey
 * bar. Shows after ten minutes in the app while the survey is new; «×» says
 * no for good, as before.
 */
const { t } = useI18n()
const ui = useUiStore()
const invite = useSurveyInvite()
</script>

<template>
  <div v-if="invite.shown.value" class="inv" data-testid="survey-invite">
    <span class="inv__icon" aria-hidden="true"
      ><UiIcon name="chat" :size="20" :stroke="1.8"
    /></span>
    <span class="inv__text">
      <strong>{{ t('survey.invite') }}</strong>
      <span>{{ t('survey.inviteText') }}</span>
    </span>
    <UiButton
      variant="contrast"
      :size="36"
      data-testid="survey-invite-open"
      @click="ui.openDialog('survey')"
      >{{ t('survey.go') }}</UiButton
    >
    <UiButton
      variant="ghost"
      icon="close"
      :size="36"
      :label="t('survey.dismiss')"
      data-testid="survey-invite-close"
      @click="invite.reject()"
    />
  </div>
</template>

<style scoped>
.inv {
  padding: 12px 12px 12px 16px;
  border-radius: 18px;
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 12px;
}

.inv__icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--primary-soft);
  color: var(--link);
  display: flex;
  align-items: center;
  justify-content: center;
}

.inv__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.inv__text strong {
  font-size: 15px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text);
}
</style>
