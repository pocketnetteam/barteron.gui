<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { referralLink, REFERRAL_TERMS_URL } from '@/config/roles'
import { copyText } from '@/lib/clipboard'
import { useSessionStore } from '@/stores/session'
import { showToast } from '@/ui/toast'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'

/**
 * «Реферальная программа» (s8-dialogs), the old referral dialog: the terms
 * live on barteron.bastyon.com, the link is Barteron in Bastyon with my
 * address (`&ref=`). Copying may be refused inside the host frame; then the
 * link is shown to copy by hand.
 */
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const session = useSessionStore()

const link = computed(() => (session.address ? referralLink(session.address) : ''))
const failed = ref(false)

async function copy() {
  if (!link.value) return
  failed.value = !(await copyText(link.value))
  if (!failed.value) {
    showToast(t('referral.copied'))
    open.value = false
  }
}

const openTerms = () =>
  void session.sdk?.openExternalLink(REFERRAL_TERMS_URL).catch(() => undefined)
</script>

<template>
  <UiDialog v-model:open="open" :title="t('referral.title')" :width="480">
    <div class="ref" data-testid="referral-dialog">
      <div class="ref__promo">
        <strong class="ref__promo-title">{{ t('referral.promo') }}</strong>
        <span class="ref__promo-text">{{ t('referral.promoText') }}</span>
      </div>
      <p class="ref__text">{{ t('referral.text') }}</p>
      <UiButton class="ref__terms" variant="ghost" :size="36" external @click="openTerms">{{
        t('referral.terms')
      }}</UiButton>
      <div v-if="failed" class="ref__failed" role="alert" data-testid="referral-failed">
        <strong>{{ t('referral.copyFailed') }}</strong>
        <span>{{ t('referral.copyByHand') }}</span>
        <input
          class="ref__link"
          :value="link"
          readonly
          @focus="($event.target as HTMLInputElement).select()"
        />
      </div>
    </div>
    <template #actions>
      <UiButton v-if="link" block icon="link" data-testid="referral-copy" @click="copy">{{
        t('referral.copy')
      }}</UiButton>
      <UiButton v-else block data-testid="referral-signin" @click="session.ensureSignedIn()">{{
        t('referral.signIn')
      }}</UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.ref {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.ref__promo {
  align-self: stretch;
  padding: 16px;
  border-radius: 14px;
  background: var(--warning-soft);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ref__promo-title {
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
  color: var(--warning);
}

.ref__promo-text,
.ref__text {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.ref__terms {
  margin-left: -12px;
}

.ref__failed {
  align-self: stretch;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--danger-soft);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 18px;
}

.ref__failed strong {
  color: var(--danger);
  font-size: 14px;
}

.ref__link {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: 400 13px / 18px var(--font-mono, monospace);
}
</style>
