<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBarteron } from '@/api/queries'
import type { useMyAccount } from '@/composables/my-account'
import { otherModerators } from '@/config/roles'
import { canLeaveModeration, moderatorAvailable, withModerator } from '@/models/account'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiField from '@/ui/UiField.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSegmented from '@/ui/UiSegmented.vue'

/**
 * Moderator status (s5-wallet-desktop, s5-states «Модератор: статус не
 * переключается»). Kept in my profile, `metaData.votingModeration.moderator`.
 * Going off duty needs another moderator on duty (old `checkSaving`).
 */
const props = defineProps<{ account: ReturnType<typeof useMyAccount> }>()
const { t } = useI18n()
const session = useSessionStore()
const barteron = useBarteron()

const saved = computed(
  () => !!props.account.shown.value && moderatorAvailable(props.account.shown.value)
)
const status = ref<'on' | 'off'>(saved.value ? 'on' : 'off')
const nobody = ref(false)
const checking = ref(false)

function reset() {
  status.value = saved.value ? 'on' : 'off'
}
watch(saved, reset)

const changed = computed(() => (status.value === 'on') !== saved.value)
const locked = computed(
  () => props.account.pending.value || !props.account.canSave.value || checking.value
)

async function save() {
  if (!changed.value || locked.value) return
  const on = status.value === 'on'
  if (!on && saved.value) {
    checking.value = true
    try {
      const others = await barteron.value!.api.accounts(otherModerators(session.address ?? ''))
      if (!canLeaveModeration(others)) {
        reset()
        nobody.value = true
        return
      }
    } catch (error) {
      console.error('[barteron] moderators check failed:', error)
      reset()
      nobody.value = true
      return
    } finally {
      checking.value = false
    }
  }
  props.account.save((a) => withModerator(a, on))
}

const statuses = computed(() => [
  { value: 'on' as const, label: t('wallet.available') },
  { value: 'off' as const, label: t('wallet.unavailable') },
])
</script>

<template>
  <div class="role" data-testid="role-moderator">
    <div class="role__head">
      <span class="role__icon role__icon--info"><UiIcon name="star" :size="22" /></span>
      <div class="role__titles">
        <span class="role__title">{{ t('wallet.moderator.title') }}</span>
        <span class="role__text">{{ t('wallet.moderator.text') }}</span>
      </div>
    </div>
    <UiField :label="t('wallet.status')" group>
      <UiSegmented
        v-model="status"
        :items="statuses"
        :label="t('wallet.status')"
        :disabled="locked"
        @update:model-value="nobody = false"
      />
    </UiField>
    <UiAlert v-if="nobody" tone="warning" live data-testid="moderator-nobody">{{
      t('wallet.moderator.nobody')
    }}</UiAlert>
    <UiAlert v-if="account.pending.value" tone="warning" busy>{{ t('wallet.updating') }}</UiAlert>
    <div v-else-if="changed" class="role__actions">
      <UiButton
        :size="40"
        :loading="checking"
        :disabled="locked"
        data-testid="moderator-save"
        @click="save"
        >{{ t('wallet.save') }}</UiButton
      >
      <UiButton variant="neutral" :size="40" @click="reset">{{ t('wallet.cancel') }}</UiButton>
    </div>
  </div>
</template>
