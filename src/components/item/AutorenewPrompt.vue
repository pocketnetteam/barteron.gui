<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories, useOffersByAddress } from '@/api/queries'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import { formatDate } from '@/lib/format'
import { offerLifecycle, toOfferPayload, withPublication, type Offer } from '@/models/offer'
import { useAutorenewStore } from '@/stores/autorenew'
import { useSessionStore } from '@/stores/session'
import { useTxStore } from '@/stores/tx'
import { showToast } from '@/ui/toast'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'

/**
 * On entry: my offers whose year is running out (or has run out) with
 * «Автопродление» on — one confirmation renews them all, one transaction per
 * offer, each with its own network status (PLAN.md, stage 4).
 */
const { t, locale } = useI18n()
const session = useSessionStore()
const tx = useTxStore()
const autorenew = useAutorenewStore()
const categories = useCategories()
const ctx = useCardContext()
const mine = useOffersByAddress(() => session.address)

const open = ref(false)
const shownOnce = ref(false)
/** Not those already on their way, and only leaves: the old app refused to renew into a parent category. */
const due = computed(() => {
  const tree = categories.tree.value
  return autorenew
    .due(mine.data.value ?? [])
    .filter((o) => !tx.latestFor(o.hash, ['offer', 'offerRemove']))
    .filter((o) => !tree || (o.tag !== null && tree.isLeaf(o.tag)))
})

watch(
  () => [due.value.length, categories.tree.value] as const,
  ([n, tree]) => {
    if (n && tree && !shownOnce.value) {
      shownOnce.value = true
      open.value = true
    }
  },
  { immediate: true }
)

function when(o: Offer) {
  return offerLifecycle(o) === 'expired'
    ? t('item.autorenew.expired', { date: formatDate(o.till, locale.value) })
    : t('item.autorenew.till', { date: formatDate(o.till, locale.value) })
}

function renewAll() {
  const tree = categories.tree.value
  let sent = 0
  for (const o of due.value) {
    try {
      void tx.send(
        'offer',
        toOfferPayload(
          withPublication(o, 'published'),
          tree ? { isLeafCategory: (id) => tree.isLeaf(id) } : {}
        )
      )
      sent++
    } catch (error) {
      console.error('[barteron] renewal skipped:', error)
    }
  }
  // Asked once: the renewals are on their way, the rest can wait a day.
  autorenew.snooze()
  open.value = false
  if (sent) showToast(t('item.autorenew.sent', { n: sent }, sent), { kind: 'info' })
}

function later() {
  autorenew.snooze()
  open.value = false
}
</script>

<template>
  <UiDialog
    v-model:open="open"
    :title="t('item.autorenew.title', { n: due.length }, due.length)"
    :width="520"
    data-testid="autorenew-prompt"
    @update:open="(v: boolean) => !v && autorenew.snooze()"
  >
    <p class="ar__text">{{ t('item.autorenew.text') }}</p>
    <ul class="ar__list">
      <li v-for="o in due" :key="o.hash!" class="ar__item">
        <OfferPhoto
          class="ar__photo"
          :src="offerCardData(o, ctx).photo"
          ratio="4 / 3"
          radius="8px"
        />
        <span class="ar__body">
          <span class="ar__title">{{ o.caption }}</span>
          <span class="ar__when">{{ when(o) }}</span>
        </span>
      </li>
    </ul>
    <p class="ar__hint">{{ t('item.autorenew.hint') }}</p>
    <template #actions>
      <UiButton variant="neutral" @click="later">{{ t('item.autorenew.later') }}</UiButton>
      <UiButton data-testid="autorenew-confirm" @click="renewAll">
        {{ t('item.autorenew.renew', { n: due.length }, due.length) }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.ar__text {
  color: var(--text2);
  font-size: 15px;
  line-height: 22px;
}

.ar__list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ar__item {
  padding: 8px;
  border-radius: var(--radius-m);
  background: var(--subtle);
  display: flex;
  align-items: center;
  gap: 12px;
}

.ar__photo {
  width: 56px;
  flex: none;
}

.ar__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ar__title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ar__when {
  color: var(--text2);
  font-size: 13px;
}

.ar__hint {
  margin-top: 16px;
  color: var(--text3);
  font-size: 12px;
  line-height: 16px;
}
</style>
