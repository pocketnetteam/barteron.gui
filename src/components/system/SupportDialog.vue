<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSupport } from '@/composables/support'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiIcon from '@/ui/UiIcon.vue'

/** «Написать в поддержку» (s8-dialogs): the address, copy it or write a letter. */
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const support = useSupport()
</script>

<template>
  <UiDialog v-model:open="open" :title="t('support.title')" :width="480">
    <div class="sup" data-testid="support-dialog">
      <p class="sup__text">{{ t('support.text') }}</p>
      <div class="sup__address">
        <UiIcon name="mail" :size="20" class="sup__icon" />
        <span class="sup__email" data-testid="support-email">{{ support.email }}</span>
        <UiButton
          variant="ghost"
          icon="copy"
          :size="36"
          :label="t('support.copy')"
          @click="support.copyEmail()"
        />
      </div>
      <p class="sup__hint">{{ t('support.hint') }}</p>
    </div>
    <template #actions>
      <UiButton variant="ghost" data-testid="support-copy" @click="support.copyEmail()">{{
        t('support.copy')
      }}</UiButton>
      <UiButton external data-testid="support-write" @click="support.writeEmail()">{{
        t('support.write')
      }}</UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.sup {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sup__text,
.sup__hint {
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  color: var(--text2);
}

.sup__hint {
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.sup__address {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 14px;
  border-radius: 12px;
  background: var(--subtle);
  box-shadow: inset 0 0 0 1px var(--border);
}

.sup__icon {
  flex: none;
  color: var(--text2);
}

.sup__email {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 16px;
  line-height: 22px;
  font-weight: 600;
  user-select: all;
}
</style>
