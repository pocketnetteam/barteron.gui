<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useUiStore, type AppDialog } from '@/stores/ui'

/** The window `ui.dialog` names (s8-dialogs, s8-sheets-mobile, s8-system); each loads when first opened. */
const DIALOGS: Record<AppDialog, Component> = {
  support: defineAsyncComponent(() => import('./SupportDialog.vue')),
  survey: defineAsyncComponent(() => import('./SurveyDialog.vue')),
  referral: defineAsyncComponent(() => import('./ReferralDialog.vue')),
  legal: defineAsyncComponent(() => import('./LegalDialog.vue')),
  currency: defineAsyncComponent(() => import('./CurrencyDialog.vue')),
  language: defineAsyncComponent(() => import('./LanguageDialog.vue')),
  theme: defineAsyncComponent(() => import('./ThemeDialog.vue')),
  permissions: defineAsyncComponent(() => import('./PermissionsDialog.vue')),
  activation: defineAsyncComponent(() => import('./ActivationDialog.vue')),
}

const ui = useUiStore()
const current = computed(() => (ui.dialog ? DIALOGS[ui.dialog] : null))
const open = computed({
  get: () => !!ui.dialog,
  set: (value) => {
    if (!value) ui.closeDialog()
  },
})
</script>

<template>
  <component :is="current" v-if="current" :key="ui.dialog" v-model:open="open" />
</template>
