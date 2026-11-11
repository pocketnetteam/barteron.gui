<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { surveyProblem } from '@/api/survey'
import { useSurvey } from '@/composables/survey'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiField from '@/ui/UiField.vue'
import UiInput from '@/ui/UiInput.vue'
import UiTextarea from '@/ui/UiTextarea.vue'
import SystemState from './SystemState.vue'

/**
 * «Анонимный опрос» (s8-dialogs): the old app's two questions and an optional
 * e-mail. A failed send keeps the text in the form; a sent one says thanks.
 */
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const session = useSessionStore()
const survey = useSurvey()

const form = reactive({ answer1: '', answer2: '', email: '' })
const problem = ref<'empty' | 'email' | null>(null)
const phase = ref<'form' | 'sending' | 'failed' | 'sent'>('form')

async function submit() {
  problem.value = surveyProblem(form)
  if (problem.value) return
  phase.value = 'sending'
  try {
    await survey.send({ ...form })
    phase.value = 'sent'
  } catch {
    phase.value = 'failed'
  }
}

function input() {
  if (problem.value === 'empty' && (form.answer1.trim() || form.answer2.trim()))
    problem.value = null
}
</script>

<template>
  <UiDialog
    v-model:open="open"
    :title="t('survey.title')"
    :hide-title="phase === 'sent'"
    :closable="phase !== 'sending'"
    :width="480"
  >
    <SystemState
      v-if="phase === 'sent'"
      bare
      kind="survey-sent"
      icon="check"
      tone="success"
      :title="t('survey.sent')"
      :text="t('survey.sentText')"
    >
      <UiButton
        variant="outline"
        class="srv__done"
        data-testid="survey-done"
        @click="open = false"
        >{{ t('survey.done') }}</UiButton
      >
    </SystemState>

    <div v-else-if="!survey.me.value" class="srv" data-testid="survey-dialog">
      <p class="srv__text">{{ t('survey.signIn') }}</p>
    </div>

    <form v-else id="survey-form" class="srv" data-testid="survey-dialog" @submit.prevent="submit">
      <UiAlert
        v-if="phase === 'failed'"
        tone="danger"
        live
        :title="t('survey.failed')"
        data-testid="survey-failed"
      >
        {{ t('survey.failedText') }}
      </UiAlert>
      <UiField v-slot="{ id }" :label="t('survey.question1')">
        <UiTextarea
          :id="id"
          v-model="form.answer1"
          :rows="3"
          :placeholder="t('survey.answer')"
          :invalid="problem === 'empty'"
          maxlength="9000"
          data-testid="survey-answer1"
          @input="input"
        />
      </UiField>
      <UiField v-slot="{ id }" :label="t('survey.question2')">
        <UiTextarea
          :id="id"
          v-model="form.answer2"
          :rows="3"
          :placeholder="t('survey.answer')"
          :invalid="problem === 'empty'"
          maxlength="9000"
          data-testid="survey-answer2"
          @input="input"
        />
      </UiField>
      <p v-if="problem === 'empty'" class="srv__error" role="alert" data-testid="survey-empty">
        {{ t('survey.empty') }}
      </p>
      <UiField v-slot="{ id }" :error="problem === 'email' ? t('survey.badEmail') : undefined">
        <UiInput
          :id="id"
          v-model="form.email"
          type="email"
          autocomplete="email"
          :placeholder="t('survey.email')"
          data-testid="survey-email"
        />
      </UiField>
      <!-- The old app sent the address too; say so, since the survey is called anonymous. -->
      <p class="srv__note">{{ t('survey.note') }}</p>
    </form>

    <template v-if="phase !== 'sent'" #actions>
      <template v-if="survey.me.value">
        <UiButton variant="ghost" :disabled="phase === 'sending'" @click="open = false">{{
          t('ui.cancel')
        }}</UiButton>
        <UiButton
          type="submit"
          form="survey-form"
          :loading="phase === 'sending'"
          data-testid="survey-send"
          >{{ t('survey.send') }}</UiButton
        >
      </template>
      <UiButton v-else block @click="session.ensureSignedIn()">{{
        t('survey.signInAction')
      }}</UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.srv {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.srv__text {
  margin: 0;
  color: var(--text2);
  font-size: 15px;
  line-height: 22px;
}

.srv__error {
  margin: -6px 0 0;
  color: var(--danger);
  font-size: 13px;
  line-height: 18px;
}

.srv__done {
  align-self: center;
}

.srv__note {
  margin: -4px 0 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}
</style>
