<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import SectionHead from './SectionHead.vue'

/** «Сделки» (stage 8): the place is kept in the menu, the screen comes later. */
defineProps<{ kind: 'deals' }>()
const { t } = useI18n()
</script>

<template>
  <section class="soon" :data-testid="`cabinet-${kind}`">
    <SectionHead :title="t(`cabinet.sections.${kind}`)" />
    <UiEmptyState
      icon="safe-deal"
      :title="t(`cabinet.soon.${kind}.title`)"
      :text="t(`cabinet.soon.${kind}.text`)"
    />
  </section>
</template>

<style scoped>
.soon {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
