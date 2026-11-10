<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOfferForm } from '@/composables/offer-form'
import { isPointDraft } from '@/models/draft'
import PhotoGrid from './PhotoGrid.vue'
import StepHead from './StepHead.vue'
import VideoField from './VideoField.vue'

/** Step 2 (s4-step2, s4-media-mobile): photos, and a video for an ordinary offer. */
const { t } = useI18n()
const form = useOfferForm()
const point = computed(() => isPointDraft(form.draft.value!))
</script>

<template>
  <StepHead
    :n="form.stepIndex.value + 1"
    :total="form.steps.value.length"
    :title="point ? t('create.media.titlePoint') : t('create.media.title')"
  />
  <PhotoGrid />
  <VideoField v-if="!point" />
</template>
