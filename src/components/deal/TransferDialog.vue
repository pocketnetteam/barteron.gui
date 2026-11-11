<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'

/**
 * «Перевести оплату гаранту?» (s7-dealstates «Подтверждение перевода»):
 * who gets it and how much; then the Bastyon wallet opens.
 */
defineProps<{
  title: string
  recipient: string
  amount: string
  sending?: boolean
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
const { t } = useI18n()
</script>

<template>
  <UiDialog v-model:open="open" :title="title" :width="420" :closable="!sending">
    <dl class="td">
      <div>
        <dt>{{ t('deal.transfer.recipient') }}</dt>
        <dd>{{ recipient }}</dd>
      </div>
      <div>
        <dt>{{ t('deal.transfer.amount') }}</dt>
        <dd class="td__amount">{{ amount }}</dd>
      </div>
    </dl>
    <p class="td__note">
      {{ sending ? t('deal.transfer.progressNote') : t('deal.transfer.note') }}
    </p>
    <template #actions>
      <UiButton variant="neutral" :disabled="sending" @click="open = false">{{
        t('ui.cancel')
      }}</UiButton>
      <UiButton
        external
        :loading="sending"
        data-testid="transfer-confirm"
        @click="emit('confirm')"
        >{{ sending ? t('deal.transfer.progress') : t('deal.transfer.confirm') }}</UiButton
      >
    </template>
  </UiDialog>
</template>

<style scoped>
.td {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
}

.td div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.td dt {
  color: var(--text2);
}

.td dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.td__amount {
  color: var(--pkoin);
}

.td__note {
  margin-top: 12px;
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}
</style>
