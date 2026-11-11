<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { useMyAccount } from '@/composables/my-account'
import { DEFAULT_GUARANTOR_FEE_PERCENT } from '@/config/roles'
import { guarantorState, isValidGuarantorFee, withGuarantor } from '@/models/account'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiField from '@/ui/UiField.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiInput from '@/ui/UiInput.vue'
import UiSegmented from '@/ui/UiSegmented.vue'

/**
 * Guarantor settings (s5-wallet-desktop): whether I take new deals and my fee.
 * Kept in my Barteron profile, `safeDeal.validator` (old `safe-deal-profile`).
 */
const props = defineProps<{ account: ReturnType<typeof useMyAccount> }>()
const { t } = useI18n()

const saved = computed(() =>
  props.account.shown.value
    ? guarantorState(props.account.shown.value, DEFAULT_GUARANTOR_FEE_PERCENT)
    : { available: false, feePercent: DEFAULT_GUARANTOR_FEE_PERCENT }
)
const available = ref<'on' | 'off'>(saved.value.available ? 'on' : 'off')
const fee = ref<string | number>(String(saved.value.feePercent))
const feeNumber = computed(() => Number(String(fee.value).replace(',', '.')))
const feeError = computed(() =>
  isValidGuarantorFee(feeNumber.value) ? '' : t('wallet.guarantor.feeError')
)

function reset() {
  available.value = saved.value.available ? 'on' : 'off'
  fee.value = String(saved.value.feePercent)
}
// Values, not the object: it is rebuilt whenever any transaction changes.
watch(() => [saved.value.available, saved.value.feePercent], reset)

const changed = computed(
  () =>
    (available.value === 'on') !== saved.value.available ||
    feeNumber.value !== saved.value.feePercent
)
const locked = computed(() => props.account.pending.value || !props.account.canSave.value)

function save() {
  if (!changed.value || feeError.value) return
  props.account.save((a) =>
    withGuarantor(a, { available: available.value === 'on', feePercent: feeNumber.value })
  )
}

const statuses = computed(() => [
  { value: 'on' as const, label: t('wallet.available') },
  { value: 'off' as const, label: t('wallet.unavailable') },
])
</script>

<template>
  <div class="role" data-testid="role-guarantor">
    <div class="role__head">
      <span class="role__icon role__icon--success"><UiIcon name="shield" :size="22" /></span>
      <div class="role__titles">
        <span class="role__title">{{ t('wallet.guarantor.title') }}</span>
        <span class="role__text">{{ t('wallet.guarantor.text') }}</span>
      </div>
    </div>
    <UiField :label="t('wallet.status')" group>
      <UiSegmented
        v-model="available"
        :items="statuses"
        :label="t('wallet.status')"
        :disabled="locked"
      />
    </UiField>
    <UiField class="role__fee" :label="t('wallet.guarantor.fee')" :error="feeError">
      <UiInput
        v-model="fee"
        inputmode="decimal"
        suffix="%"
        :disabled="locked"
        data-testid="guarantor-fee"
      />
    </UiField>
    <UiAlert v-if="account.pending.value" tone="warning" busy>{{ t('wallet.updating') }}</UiAlert>
    <div v-else-if="changed" class="role__actions">
      <UiButton
        :size="40"
        :disabled="!!feeError || locked"
        data-testid="guarantor-save"
        @click="save"
        >{{ t('wallet.save') }}</UiButton
      >
      <UiButton variant="neutral" :size="40" @click="reset">{{ t('wallet.cancel') }}</UiButton>
    </div>
  </div>
</template>

<style scoped>
.role__fee {
  max-width: 200px;
}
</style>
