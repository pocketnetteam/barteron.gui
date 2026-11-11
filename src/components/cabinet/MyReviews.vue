<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { cabinetRoute } from '@/composables/cabinet'
import { usePhone } from '@/composables/media'
import { useProfileReviews } from '@/composables/profile-reviews'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiTabs from '@/ui/UiTabs.vue'
import ReviewList from './ReviewList.vue'
import SectionHead from './SectionHead.vue'

/** «Отзывы обо мне»: reviews on any of my offers (old profile tab `#votes`). */
const { t } = useI18n()
const router = useRouter()
const session = useSessionStore()
const favorites = useFavoritesStore()
const reviews = useProfileReviews(() => session.address)
/** On a phone these are items of the cabinet menu: no tabs. */
const phone = usePhone()

type Tab = 'favorites' | 'viewed' | 'votes'
const tabs = computed(() => [
  {
    value: 'favorites' as Tab,
    label: t('cabinet.sections.favorites'),
    count: favorites.ids.length || undefined,
  },
  { value: 'viewed' as Tab, label: t('cabinet.sections.viewed') },
  {
    value: 'votes' as Tab,
    label: t('cabinet.sections.votesFull'),
    count: reviews.rows.value.length || undefined,
  },
])
const tab = computed<Tab>({
  get: () => 'votes' as Tab,
  set: (value) => void router.replace(cabinetRoute(session.address, value)),
})
</script>

<template>
  <section class="myr" data-testid="cabinet-votes">
    <SectionHead :title="t('cabinet.sections.votesFull')" />
    <UiTabs v-if="!phone" v-model="tab" :items="tabs" :label="t('cabinet.nav')" />

    <UiAlert v-if="reviews.error.value" tone="danger" :title="t('reviewsAbout.error')">
      <template #action>
        <UiButton variant="on-danger" :size="36" @click="reviews.refetch()">{{
          t('ui.retry')
        }}</UiButton>
      </template>
    </UiAlert>
    <div v-else-if="reviews.loading.value" class="myr__card">
      <UiSkeleton v-for="i in 3" :key="i" height="64px" radius="12px" />
    </div>
    <UiEmptyState
      v-else-if="!reviews.rows.value.length"
      icon="star"
      :title="t('reviewsAbout.empty.title')"
      :text="t('reviewsAbout.empty.text')"
    />
    <div v-else class="myr__card">
      <ReviewList :rows="reviews.rows.value" avatars />
    </div>
  </section>
</template>

<style scoped>
.myr {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.myr__card {
  padding: 8px 24px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 767px) {
  .myr__card {
    padding: 4px 16px;
  }
}
</style>
