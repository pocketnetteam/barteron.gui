<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOfferForm } from '@/composables/offer-form'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSegmented from '@/ui/UiSegmented.vue'
import UiSpinner from '@/ui/UiSpinner.vue'

const ConfirmDialog = defineAsyncComponent(() => import('@/components/item/ConfirmDialog.vue'))

/**
 * One video for the offer (s4-step2): Bastyon's upload window, then PeerTube
 * processes it — the old app checked every 20 seconds and would not publish
 * before it was ready. Placed first or last among the photos.
 */
const { t } = useI18n()
const form = useOfferForm()
const session = useSessionStore()
const d = computed(() => form.draft.value!)
const status = computed(() => form.videoStatus.value)
const info = computed(() => form.videoInfo.value)
const supported = computed(() => form.videosSupported.value)
const poster = computed(() => {
  const value = info.value?.poster
  return value ? (session.sdk?.manageBastyonImageSrc(value) ?? value) : null
})

const orders = computed(() => [
  { value: 'first' as const, label: t('create.media.first') },
  { value: 'last' as const, label: t('create.media.last') },
])

const confirmOpen = ref(false)
async function remove() {
  confirmOpen.value = false
  await form.removeVideo()
}
</script>

<template>
  <section class="vf" data-field="video" :aria-label="t('create.media.video')">
    <div class="vf__head">
      <h2 class="vf__title">{{ t('create.media.video') }}</h2>
      <span class="vf__note vf__note--desk">{{ t('create.media.videoOptional') }}</span>
      <span class="vf__note vf__note--phone">{{ t('create.media.videoOptionalShort') }}</span>
    </div>

    <p v-if="!supported" class="vf__hint">{{ t('create.media.videoUnavailable') }}</p>

    <template v-else-if="!d.video">
      <button
        type="button"
        class="vf__add"
        :disabled="form.videoBusy.value"
        data-testid="create-video-add"
        @click="form.addVideo()"
      >
        <UiSpinner v-if="form.videoBusy.value" :size="22" />
        <UiIcon v-else name="video" :size="24" />
        <span>{{
          form.videoBusy.value ? t('create.media.videoOpening') : t('create.media.videoAdd')
        }}</span>
      </button>
      <p class="vf__hint vf__hint--desk">{{ t('create.media.videoHint') }}</p>
      <p class="vf__hint vf__hint--phone">{{ t('create.media.videoHintPhone') }}</p>
    </template>

    <template v-else>
      <div class="vf__row">
        <div class="vf__tile" :data-testid="`create-video-${status}`">
          <img v-if="poster && status === 'ready'" class="vf__poster" :src="poster" alt="" />
          <span v-if="status === 'loading' || status === 'processing'" class="vf__state">
            <UiSpinner :size="22" />
            {{
              status === 'loading'
                ? t('create.media.videoLoading')
                : t('create.media.videoProcessing')
            }}
          </span>
          <span v-else-if="status === 'ready'" class="vf__state vf__state--ready">
            <UiIcon name="play" :size="28" />{{ t('create.media.videoReady') }}
          </span>
          <span v-else class="vf__state vf__state--failed">
            <UiIcon name="error" :size="22" :stroke="2" />
            {{
              status === 'missing' ? t('create.media.videoMissing') : t('create.media.videoFailed')
            }}
            <button type="button" class="vf__check" @click="form.retryVideo()">
              {{ t('create.media.videoCheck') }}
            </button>
          </span>
          <span v-if="info?.duration" class="vf__duration tabular">{{ info.duration }}</span>
        </div>

        <div class="vf__side">
          <span class="vf__label">{{ t('create.media.videoOrder') }}</span>
          <UiSegmented
            v-model="d.videoOrder"
            :items="orders"
            :label="t('create.media.videoOrder')"
          />
          <UiAlert
            v-if="status === 'processing' || status === 'loading'"
            tone="warning"
            icon="warning"
          >
            {{ t('create.media.videoWait') }}
          </UiAlert>
          <p v-if="form.fieldError('video')" class="vf__error" role="alert">
            <UiIcon name="error" :size="14" :stroke="2" />{{ form.fieldError('video') }}
          </p>
          <UiButton
            class="vf__remove"
            variant="danger-text"
            :size="36"
            data-testid="create-video-remove"
            @click="confirmOpen = true"
          >
            {{ t('create.media.videoRemove') }}
          </UiButton>
        </div>
      </div>
      <p class="vf__hint vf__hint--desk">{{ t('create.media.videoHint') }}</p>
    </template>

    <ConfirmDialog
      v-if="confirmOpen"
      v-model:open="confirmOpen"
      :title="t('create.media.videoRemoveTitle')"
      :text="
        d.videoUploadedHere
          ? t('create.media.videoRemoveHere')
          : t('create.media.videoRemovePublished')
      "
      :confirm="t('create.media.videoRemove')"
      danger
      @confirm="remove"
    />
  </section>
</template>

<style scoped>
.vf {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.vf__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.vf__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.vf__note {
  font-size: 13px;
  color: var(--text3);
}

.vf__note--phone,
.vf__hint--phone {
  display: none;
}

.vf__add {
  height: 96px;
  border: 1.5px dashed var(--border-strong);
  border-radius: 14px;
  background: transparent;
  color: var(--text2);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.vf__add:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.vf__add:focus-visible,
.vf__check:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.vf__row {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.vf__tile {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  background: var(--muted);
}

.vf__poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vf__state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
}

.vf__state--ready {
  color: var(--text);
}

.vf__state--failed {
  background: var(--danger-soft);
  color: var(--danger);
  font-weight: 500;
}

.vf__check {
  border: 0;
  background: transparent;
  color: var(--link);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
}

.vf__duration {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgb(0 0 0 / 70%);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}

.vf__side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vf__label {
  font-size: 14px;
  font-weight: 600;
}

.vf__remove {
  align-self: center;
}

.vf__error {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--danger);
}

.vf__hint {
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: var(--text2);
}

@media (max-width: 767px) {
  .vf__note--desk,
  .vf__hint--desk {
    display: none;
  }

  .vf__note--phone,
  .vf__hint--phone {
    display: block;
  }

  .vf__row {
    grid-template-columns: 1fr;
  }

  .vf__remove {
    align-self: flex-start;
  }
}
</style>
