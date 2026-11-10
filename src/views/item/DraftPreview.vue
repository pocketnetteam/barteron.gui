<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAccount, useOffer, useRates } from '@/api/queries'
import AppLayout from '@/components/layout/AppLayout.vue'
import { draftKey } from '@/composables/offer-form'
import { readStored } from '@/lib/storage'
import { draftFromOffer, offerFromDraft, readDraft, stepsOf } from '@/models/draft'
import { isPickupPoint } from '@/models/offer'
import { isTxid } from '@/models/tx'
import { useSessionStore } from '@/stores/session'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import OfferPage from './OfferPage.vue'

/**
 * «Открыть полную страницу» from the form: the draft as buyers will see it,
 * on `/barter/draft` like the old app's preview (`/barter/draft?preview=1`).
 * `?edit=<id>` — the draft of an offer being edited.
 */
const { t, locale } = useI18n()
const route = useRoute()
const session = useSessionStore()
const rates = useRates()
const account = useAccount(() => session.address)

const edit = computed(() => {
  const value = route.query.edit
  return typeof value === 'string' && isTxid(value) ? value : null
})
const original = useOffer(edit)

const draft = computed(() => {
  const me = session.address
  if (!me) return null
  const stored = readDraft(readStored<unknown>(draftKey(edit.value, me), null))
  if (stored) return stored
  // An edit without changes keeps no draft: the offer as it is.
  const offer = original.data.value
  return edit.value && offer ? draftFromOffer(offer, locale.value) : null
})

const offer = computed(() => {
  const me = session.address
  const value = draft.value
  if (!me || !value) return null
  return offerFromDraft(value, {
    address: me,
    language: locale.value,
    rates: rates.data.value ?? null,
    myList: account.data.value?.tags ?? [],
    base: edit.value ? (original.data.value ?? null) : null,
  })
})

/** Back to the review step of the form. */
const back = computed(() => ({
  name: 'createBarter',
  params: edit.value ? { id: edit.value } : {},
  query: draft.value ? { step: String(stepsOf(draft.value).length) } : {},
}))
</script>

<template>
  <OfferPage v-if="offer && !isPickupPoint(offer)" :offer="offer" preview :draft-back="back" />
  <AppLayout v-else>
    <div class="container dp" data-testid="draft-missing">
      <UiEmptyState icon="document" :title="t('create.state.missingTitle')">
        <UiButton :to="back">{{ t('item.draftPreview.back') }}</UiButton>
      </UiEmptyState>
    </div>
  </AppLayout>
</template>

<style scoped>
.dp {
  padding-top: 32px;
  padding-bottom: 64px;
}
</style>
