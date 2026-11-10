<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'

/** «Опубликовать снова?», «Снять с публикации?», «Удалить объявление?» (s3-item-dialogs). */
withDefaults(defineProps<{ title: string; text: string; confirm: string; danger?: boolean }>(), {
  danger: false,
})
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
const { t } = useI18n()
</script>

<template>
  <UiDialog v-model:open="open" :title="title" :width="520">
    <p class="cd__text">{{ text }}</p>
    <template #actions>
      <UiButton variant="neutral" @click="open = false">{{ t('ui.cancel') }}</UiButton>
      <UiButton
        :variant="danger ? 'danger' : 'primary'"
        data-testid="confirm-action"
        @click="emit('confirm')"
      >
        {{ confirm }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.cd__text {
  color: var(--text2);
  font-size: 15px;
  line-height: 22px;
}
</style>
