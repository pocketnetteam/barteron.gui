<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCabinetHead } from '@/composables/cabinet-data'
import { useMyAccount } from '@/composables/my-account'
import { isGuarantor, isModerator, referralLink, REFERRAL_TERMS_URL } from '@/config/roles'
import { useSessionStore } from '@/stores/session'
import { showToast } from '@/ui/toast'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import AccountNotice from './AccountNotice.vue'
import GuarantorCard from './GuarantorCard.vue'
import ModeratorCard from './ModeratorCard.vue'
import SectionHead from './SectionHead.vue'

/**
 * «Кошелёк» (s5-wallet-desktop): the Bastyon balance, the referral link and,
 * for those who have them, the guarantor's and the moderator's settings.
 */
const { t } = useI18n()
const session = useSessionStore()
const head = useCabinetHead()
const account = useMyAccount()

const me = computed(() => session.address)
const guarantor = computed(() => isGuarantor(me.value))
const moderator = computed(() => isModerator(me.value))

/**
 * Neither host can open its wallet for an app yet (HOST-TASKS.md, item 5):
 * the buttons show up once the host has `open.wallet`.
 */
const openWallet = computed(
  () =>
    (session.sdk?.open as { wallet?: (section?: string) => Promise<unknown> } | undefined)?.wallet
)

async function copyReferral() {
  if (!me.value) return
  try {
    await navigator.clipboard.writeText(referralLink(me.value))
    showToast(t('wallet.referral.copied'))
  } catch {
    showToast(t('wallet.referral.copyFailed'), { kind: 'error' })
  }
}

const openTerms = () =>
  void session.sdk?.openExternalLink(REFERRAL_TERMS_URL).catch(() => undefined)
</script>

<template>
  <section class="wal" data-testid="cabinet-wallet">
    <SectionHead :title="t('cabinet.sections.wallet')" />
    <div class="wal__top">
      <div class="wal__card wal__balance">
        <div class="wal__label">
          <span class="wal__coin"><UiIcon name="pkoin" :size="22" :stroke="2" /></span>
          {{ t('wallet.balanceTitle') }}
        </div>
        <UiSkeleton v-if="head.balance.isPending.value" width="220px" height="40px" radius="10px" />
        <div v-else class="wal__sum" data-testid="wallet-balance">
          <span class="wal__pkoin">{{ head.pkoin.value ?? t('wallet.balanceUnknown') }}</span>
          <span v-if="head.equivalent.value" class="wal__eq">{{ head.equivalent.value }}</span>
        </div>
        <div v-if="openWallet" class="wal__buttons">
          <UiButton variant="contrast" :size="44" external @click="openWallet('topup')">{{
            t('wallet.topUp')
          }}</UiButton>
          <UiButton variant="neutral" :size="44" external @click="openWallet('history')">{{
            t('wallet.history')
          }}</UiButton>
        </div>
        <p class="wal__note">{{ t('wallet.balanceNote') }}</p>
      </div>

      <div class="wal__card wal__ref">
        <span class="wal__title">{{ t('wallet.referral.title') }}</span>
        <p class="wal__text">{{ t('wallet.referral.text') }}</p>
        <div class="wal__buttons wal__buttons--end">
          <UiButton :size="44" icon="copy" data-testid="wallet-referral" @click="copyReferral">{{
            t('wallet.referral.copy')
          }}</UiButton>
          <UiButton variant="ghost" :size="44" external @click="openTerms">{{
            t('wallet.referral.terms')
          }}</UiButton>
        </div>
      </div>
    </div>

    <template v-if="guarantor || moderator">
      <div class="wal__roles-head">
        <h2 class="wal__h2">{{ t('wallet.roles.title') }}</h2>
        <p class="wal__hint">{{ t('wallet.roles.hint') }}</p>
      </div>
      <AccountNotice v-if="!account.pending.value" :account="account" />
      <div class="wal__roles">
        <div v-if="guarantor" class="wal__card"><GuarantorCard :account="account" /></div>
        <div v-if="moderator" class="wal__card"><ModeratorCard :account="account" /></div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.wal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wal__top,
.wal__roles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.wal__card {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wal__ref {
  background: var(--primary-soft);
}

.wal__label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text2);
}

.wal__coin {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-m);
  background: var(--pkoin-soft);
  color: var(--pkoin);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wal__sum {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wal__pkoin {
  font-size: 36px;
  line-height: 44px;
  font-weight: 800;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

.wal__eq {
  font-size: 15px;
  color: var(--text2);
}

.wal__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wal__buttons--end {
  margin-top: auto;
}

.wal__note,
.wal__text,
.wal__hint {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.wal__text {
  font-size: 15px;
  line-height: 22px;
}

.wal__title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.wal__roles-head {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wal__h2 {
  margin: 0;
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
}

/* Role cards (GuarantorCard, ModeratorCard). */
.wal__card :deep(.role) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wal__card :deep(.role__head) {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wal__card :deep(.role__icon) {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-m);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wal__card :deep(.role__icon--success) {
  background: var(--success-soft);
  color: var(--success);
}

.wal__card :deep(.role__icon--info) {
  background: var(--info-soft);
  color: var(--info);
}

.wal__card :deep(.role__titles) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wal__card :deep(.role__title) {
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
}

.wal__card :deep(.role__text) {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.wal__card :deep(.role__actions) {
  display: flex;
  gap: 8px;
}

@media (max-width: 767px) {
  .wal__card {
    padding: 18px;
  }

  .wal__pkoin {
    font-size: 30px;
    line-height: 38px;
  }
}
</style>
