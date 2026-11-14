<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRouter, type RouteLocationRaw } from 'vue-router'
import StepExchange from '@/components/create/StepExchange.vue'
import StepMedia from '@/components/create/StepMedia.vue'
import StepPlace from '@/components/create/StepPlace.vue'
import StepPoint from '@/components/create/StepPoint.vue'
import StepReview from '@/components/create/StepReview.vue'
import StepWhat from '@/components/create/StepWhat.vue'
import WizardFrame, { type WizardHint, type WizardStep } from '@/components/create/WizardFrame.vue'
import ConfirmDialog from '@/components/item/ConfirmDialog.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import NotifyReminder from '@/components/cabinet/NotifyReminder.vue'
import TxPanel, { type TxStep } from '@/components/net/TxPanel.vue'
import { createOfferForm, provideOfferForm } from '@/composables/offer-form'
import { formatDate, shortHash } from '@/lib/format'
import { isPointDraft, type DraftStep } from '@/models/draft'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'

/**
 * The offer form (s4): new offer, edit, pickup point. Same paths as the old
 * app: `/barter/create`, `/barter/create/:id`, `/barter/edit/:id`.
 */
const props = defineProps<{ id: string | null }>()

const { t, locale } = useI18n()
const router = useRouter()
const session = useSessionStore()
const form = createOfferForm(() => props.id)
provideOfferForm(form)

const STEPS: Record<DraftStep, Component> = {
  what: StepWhat,
  media: StepMedia,
  exchange: StepExchange,
  point: StepPoint,
  place: StepPlace,
  review: StepReview,
}

const point = computed(() => !!form.draft.value && isPointDraft(form.draft.value))
const title = computed(() => {
  if (point.value) return form.editing.value ? t('create.titlePointEdit') : t('create.titlePoint')
  return form.editing.value ? t('create.titleEdit') : t('create.title')
})

const stepLabel = (step: DraftStep) => {
  if (point.value && step === 'media') return t('create.steps.mediaPoint')
  if (point.value && step === 'place') return t('create.steps.placePoint')
  return t(`create.steps.${step}`)
}

const wizardSteps = computed<WizardStep[]>(() =>
  form.steps.value.map((step, i) => {
    const current = form.stepIndex.value
    const errors = form.errorsOf(step).length > 0 && form.tried.has(step)
    return {
      label: stepLabel(step),
      state:
        i === current
          ? 'current'
          : errors
            ? 'error'
            : i < current || form.tried.has(step)
              ? 'done'
              : 'todo',
    }
  })
)

const HINTS: Partial<Record<string, string[]>> = {
  what: ['a', 'b'],
  media: ['a', 'b', 'c'],
  mediaPoint: ['a'],
  exchange: ['a', 'b', 'c'],
  point: ['a', 'b'],
  place: ['a', 'b'],
  placePoint: ['a'],
}
const hints = computed<WizardHint[]>(() => {
  const step = form.step.value
  const group =
    point.value && step === 'media'
      ? 'mediaPoint'
      : point.value && step === 'place'
        ? 'placePoint'
        : step
  const section = group === 'mediaPoint' ? 'media' : group
  return (HINTS[group] ?? []).map((k) => ({
    title: t(`create.hints.${section}.${k}.title`),
    text: t(`create.hints.${section}.${k}.text`),
  }))
})

const isReview = computed(() => form.step.value === 'review')
const nextStep = computed(() => form.steps.value[form.stepIndex.value + 1])

// Leaving
const offerRoute = computed<RouteLocationRaw | null>(() =>
  form.hash.value ? { name: 'barterItem', params: { id: form.hash.value } } : null
)

function exit() {
  if (offerRoute.value) void router.push(offerRoute.value)
  else if (window.history.state?.back) router.back()
  else void router.push({ name: 'home' })
}

/** Editing: the changes are not in the offer yet. A new offer's draft is kept, nothing to ask. */
const leaveOpen = ref(false)
let leaveTo: RouteLocationRaw | null = null
let leaving = false
onBeforeRouteLeave((to) => {
  if (leaving || form.published.value || !form.editing.value || !form.dirty.value) return true
  // The draft preview is part of editing.
  if (to.name === 'draftPreview') return true
  leaveTo = to.fullPath
  leaveOpen.value = true
  return false
})
function confirmLeave() {
  leaveOpen.value = false
  leaving = true
  if (leaveTo) void router.push(leaveTo)
}

// Starting over
const restartOpen = ref(false)
async function restart() {
  restartOpen.value = false
  await form.discard()
}

// Publishing: the progress opens once it went, from the footer button or
// from «Повторить публикацию» on the review.
const panelOpen = ref(false)
watch(
  () => form.published.value,
  (published) => {
    if (published) panelOpen.value = true
  }
)
async function publish() {
  await form.publish()
}

const txSteps = computed<TxStep[]>(() => {
  const tx = form.publishTx.value
  const status = tx?.status ?? 'sending'
  const failed = status === 'failed'
  return [
    { label: t('create.panel.media'), state: 'done' },
    {
      label: t('create.panel.sent'),
      detail: tx?.txid ? `tx ${shortHash(tx.txid)}` : undefined,
      mono: true,
      state: tx?.txid ? 'done' : failed ? 'error' : 'active',
    },
    {
      label: failed ? t('create.panel.failed') : t('create.panel.block'),
      state: status === 'done' ? 'done' : failed ? 'error' : tx?.txid ? 'active' : 'pending',
    },
    { label: t('create.panel.done'), state: status === 'done' ? 'done' : 'pending' },
  ]
})

function openOffer() {
  panelOpen.value = false
  const id = form.publishedId.value
  if (id) void router.push({ name: 'barterItem', params: { id } })
}

function postAnother() {
  panelOpen.value = false
  if (form.editing.value) void router.push({ name: 'createBarter' })
  else form.reset()
}

const publishLabel = computed(() => {
  if (form.activating.value) return t('create.review.publishWaitAccount')
  return form.editing.value ? t('create.review.save') : t('create.review.publish')
})
</script>

<template>
  <WizardFrame
    v-if="form.state.value === 'ready'"
    :title="title"
    :phone-title="isReview ? t('create.review.titlePhone') : title"
    :steps="wizardSteps"
    :current="form.stepIndex.value"
    :saved="!!form.savedAt.value && !form.published.value"
    :hints="hints"
    :wide="isReview"
    @exit="exit"
    @back="form.back()"
    @step="form.goTo(form.steps.value[$event]!)"
  >
    <template #top>
      <UiAlert v-if="form.activating.value" tone="info" busy data-testid="create-activating">
        {{ t('create.activating') }}
      </UiAlert>
      <!-- Storage blocked or full: the draft lives only until the app is closed. -->
      <UiAlert
        v-if="form.notKept.value && !form.published.value"
        tone="warning"
        data-testid="create-not-kept"
      >
        {{ t('create.notKept') }}
      </UiAlert>
      <UiAlert
        v-if="form.restoredAt.value && !form.published.value"
        class="cf__restored"
        tone="neutral"
        icon="document"
        data-testid="create-restored"
      >
        {{ t('create.restored', { date: formatDate(form.restoredAt.value, locale) }) }}
        <template #action>
          <UiButton
            variant="ghost"
            :size="36"
            data-testid="create-start-over"
            @click="restartOpen = true"
          >
            {{ t('create.startOver') }}
          </UiButton>
        </template>
      </UiAlert>
    </template>

    <component :is="STEPS[form.step.value]" :key="form.step.value" />

    <template #footer>
      <template v-if="!isReview">
        <UiButton
          v-if="form.stepIndex.value > 0"
          class="cf__back"
          variant="neutral"
          :size="48"
          @click="form.back()"
        >
          {{ t('create.back') }}
        </UiButton>
        <p v-else class="cf__nothing">{{ t('create.nothingPublished') }}</p>
        <span class="cf__spacer" />
        <UiButton
          class="cf__next"
          :size="48"
          icon-right="chevron-right"
          data-testid="create-next"
          @click="form.next()"
        >
          <span class="cf__next--desk">{{
            nextStep
              ? t('create.nextTo', { step: stepLabel(nextStep).toLocaleLowerCase(locale) })
              : t('create.next')
          }}</span>
          <span class="cf__next--phone">{{ t('create.next') }}</span>
        </UiButton>
      </template>

      <template v-else>
        <div class="cf__publish-text">
          <UiAlert v-if="form.editing.value" tone="warning" icon="edit">
            {{ t('create.review.editNotice') }}
          </UiAlert>
          <template v-else>
            <strong>{{ t('create.review.publishTitle') }}</strong>
            <span>{{ t('create.review.publishText') }}</span>
          </template>
        </div>
        <UiButton
          class="cf__back"
          variant="neutral"
          :size="52"
          @click="form.editing.value ? exit() : form.back()"
        >
          {{ form.editing.value ? t('create.review.cancel') : t('create.back') }}
        </UiButton>
        <UiButton
          class="cf__publish"
          :size="52"
          :loading="form.sending.value"
          :disabled="!form.canPublish.value && !form.blocking.value.length"
          data-testid="create-publish"
          @click="publish"
        >
          {{ publishLabel }}
        </UiButton>
      </template>
    </template>
  </WizardFrame>

  <AppLayout v-else>
    <div class="container cf__state" data-testid="create-state" :data-state="form.state.value">
      <div v-if="form.state.value === 'loading'" class="cf__loading" aria-busy="true">
        <UiSkeleton width="30%" height="14px" />
        <UiSkeleton width="60%" height="32px" />
        <UiSkeleton height="360px" radius="var(--radius-xl)" />
      </div>
      <UiEmptyState
        v-else-if="form.state.value === 'signin'"
        icon="user"
        :title="t('create.state.signinTitle')"
        :text="t('create.state.signinText')"
      >
        <UiButton data-testid="create-signin" @click="session.ensureSignedIn()">
          {{ t('create.state.signin') }}
        </UiButton>
      </UiEmptyState>
      <UiEmptyState
        v-else-if="form.state.value === 'foreign'"
        icon="lock"
        :title="t('create.state.foreignTitle')"
        :text="t('create.state.foreignText')"
      >
        <UiButton v-if="offerRoute" variant="neutral" :to="offerRoute">{{
          t('create.state.toOffer')
        }}</UiButton>
      </UiEmptyState>
      <UiEmptyState
        v-else-if="form.state.value === 'error'"
        icon="warning"
        :title="t('create.state.errorTitle')"
      >
        <UiButton @click="form.original.refetch()">{{ t('create.state.retry') }}</UiButton>
      </UiEmptyState>
      <UiEmptyState
        v-else
        icon="search-empty"
        :title="t('create.state.missingTitle')"
        :text="t('create.state.missingText')"
      >
        <UiButton variant="neutral" :to="{ name: 'home' }">{{ t('create.state.home') }}</UiButton>
      </UiEmptyState>
    </div>
  </AppLayout>

  <div v-if="panelOpen && form.publishTx.value" class="cf__overlay" @click.self="openOffer">
    <div class="cf__stack">
      <TxPanel
        class="cf__panel"
        :title="form.editing.value ? t('create.panel.titleEdit') : t('create.panel.title')"
        :subtitle="t('create.panel.subtitle')"
        :steps="txSteps"
        data-testid="create-panel"
        @close="openOffer"
      >
        <template #actions>
          <UiButton variant="neutral" data-testid="create-open-offer" @click="openOffer">
            {{ t('create.panel.open') }}
          </UiButton>
          <UiButton v-if="!form.editing.value" variant="ghost" @click="postAnother">
            {{ t('create.panel.more') }}
          </UiButton>
        </template>
      </TxPanel>
      <!-- A new offer: replies will come, the old app asked to set up notifications here. -->
      <NotifyReminder v-if="!form.editing.value" @open="panelOpen = false" />
    </div>
  </div>

  <ConfirmDialog
    v-if="leaveOpen"
    v-model:open="leaveOpen"
    :title="t('create.leave.title')"
    :text="t('create.leave.text')"
    :confirm="t('create.leave.leave')"
    :cancel="t('create.leave.stay')"
    danger
    @confirm="confirmLeave"
  />
  <ConfirmDialog
    v-if="restartOpen"
    v-model:open="restartOpen"
    :title="t('create.startOverTitle')"
    :text="
      form.draft.value?.videoUploadedHere ? t('create.startOverVideo') : t('create.startOverText')
    "
    :confirm="t('create.startOverConfirm')"
    danger
    @confirm="restart"
  />
</template>

<style scoped>
.cf__spacer {
  flex: 1;
}

.cf__nothing {
  margin: 0;
  max-width: 400px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.cf__next--phone {
  display: none;
}

.cf__publish-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  line-height: 19px;
  color: var(--text2);
}

.cf__publish-text strong {
  font-size: 16px;
  color: var(--text);
}

.cf__state {
  padding-top: 32px;
  padding-bottom: 64px;
}

.cf__loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 680px;
  margin: 0 auto;
}

.cf__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.cf__stack {
  width: 100%;
  max-width: 520px;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cf__panel {
  width: 100%;
}

@media (max-width: 767px) {
  .cf__back,
  .cf__nothing,
  .cf__publish-text,
  .cf__spacer,
  .cf__next--desk {
    display: none;
  }

  .cf__next--phone {
    display: inline;
  }

  .cf__next,
  .cf__publish {
    flex: 1;
  }

  .cf__overlay {
    align-items: flex-end;
    padding: 0;
  }

  .cf__stack {
    max-width: none;
  }

  /* The panel stays at the bottom edge; the reminder sits above it. */
  .cf__stack > .nrem {
    order: -1;
    margin: 0 12px;
  }

  .cf__panel {
    max-width: none;
    border-radius: 20px 20px 0 0;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
}
</style>
