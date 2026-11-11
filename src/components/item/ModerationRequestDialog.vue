<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RequestOutcome } from '@/composables/score-moderation'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiRating from '@/ui/UiRating.vue'
import UiSpinner from '@/ui/UiSpinner.vue'
import UiTextarea from '@/ui/UiTextarea.vue'

/**
 * «Заявка на модерацию оценки» (s7-moderationstates, user side): the reason,
 * then looking for a moderator on duty, then the chat. When nobody is on
 * duty or the account is being saved, the reason stays for another try.
 */
const props = defineProps<{
  score: number
  send: (reason: string) => Promise<RequestOutcome>
}>()
const open = defineModel<boolean>('open', { default: false })
const reason = defineModel<string>('reason', { default: '' })
const { t } = useI18n()
const id = useId()

const phase = ref<'form' | 'searching' | Exclude<RequestOutcome, 'sent'>>('form')
const canSend = computed(() => !!reason.value.trim() && phase.value !== 'searching')

async function submit() {
  if (!canSend.value) return
  phase.value = 'searching'
  const outcome = await props.send(reason.value.trim())
  if (outcome === 'sent') {
    reason.value = ''
    open.value = false
    return
  }
  phase.value = outcome
}
</script>

<template>
  <UiDialog
    v-model:open="open"
    :title="t('moderation.request.title')"
    :width="460"
    :closable="phase !== 'searching'"
  >
    <div
      v-if="phase === 'searching'"
      class="mrd__search"
      role="status"
      data-testid="moderation-searching"
    >
      <UiSpinner :size="28" />
      <strong>{{ t('moderation.request.searching') }}</strong>
      <span>{{ t('moderation.request.searchingText') }}</span>
    </div>

    <div v-else class="mrd" data-testid="moderation-request">
      <div class="mrd__score">
        <UiRating :value="score" variant="stars" hide-value />
        <span>{{ t('moderation.request.yourScore', { score }) }}</span>
      </div>
      <p>{{ t('moderation.request.text') }}</p>
      <UiTextarea
        :id="`mrd-${id}`"
        v-model="reason"
        :rows="3"
        :maxlength="1000"
        :aria-label="t('moderation.request.placeholder')"
        :placeholder="t('moderation.request.placeholder')"
        data-testid="moderation-reason"
      />
      <UiAlert
        v-if="phase === 'nobody'"
        tone="warning"
        :title="t('moderation.request.nobodyTitle')"
        live
      >
        {{ t('moderation.request.nobodyText') }}
      </UiAlert>
      <UiAlert
        v-else-if="phase === 'updating'"
        tone="info"
        :title="t('moderation.request.updatingTitle')"
        live
      >
        {{ t('moderation.request.updatingText') }}
      </UiAlert>
      <UiAlert v-else-if="phase === 'failed'" tone="danger" live>{{
        t('moderation.request.failed')
      }}</UiAlert>
      <p class="mrd__note">{{ t('moderation.request.note') }}</p>
    </div>

    <template #actions>
      <UiButton variant="neutral" :disabled="phase === 'searching'" @click="open = false">{{
        t('ui.cancel')
      }}</UiButton>
      <UiButton
        external
        :disabled="!canSend"
        :loading="phase === 'searching'"
        data-testid="moderation-send"
        @click="submit"
        >{{
          phase === 'form' || phase === 'searching' ? t('moderation.request.send') : t('ui.retry')
        }}</UiButton
      >
    </template>
  </UiDialog>
</template>

<style scoped>
.mrd {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 14px;
  line-height: 20px;
}

.mrd__score {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.mrd__note {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.mrd__search {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  color: var(--text2);
  font-size: 14px;
  line-height: 20px;
}

.mrd__search strong {
  color: var(--text);
  font-size: 16px;
}
</style>
