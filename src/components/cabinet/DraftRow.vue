<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/item/ConfirmDialog.vue'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import { formatAgo } from '@/lib/format'
import type { DraftEntry } from '@/models/draft'
import { useSessionStore } from '@/stores/session'
import UiBadge from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'

/** A draft kept on this device: the new offer's or an edit's (stage 5). */
const props = defineProps<{ entry: DraftEntry }>()
const emit = defineEmits<{ remove: [] }>()
const { t, locale } = useI18n()
const session = useSessionStore()

const d = computed(() => props.entry.draft)
const photo = computed(() => {
  const url = d.value.photos[0]?.url
  return url ? (session.sdk?.manageBastyonImageSrc(url) ?? url) : null
})
const title = computed(() => d.value.caption.trim() || t('myOffers.noTitle'))
const to = computed(() =>
  props.entry.hash
    ? { name: 'createBarter', params: { id: props.entry.hash } }
    : { name: 'createBarter' }
)
const confirmOpen = ref(false)
</script>

<template>
  <article class="dr" data-testid="my-draft">
    <RouterLink :to="to" class="dr__photo" tabindex="-1" aria-hidden="true">
      <OfferPhoto :src="photo" radius="12px" />
    </RouterLink>
    <div class="dr__body">
      <RouterLink :to="to" class="dr__title">{{ title }}</RouterLink>
      <div class="dr__status">
        <UiBadge tone="info" dot>{{
          entry.hash ? t('myOffers.status.editDraft') : t('myOffers.status.draft')
        }}</UiBadge>
        <span>{{ t('myOffers.savedAgo', { ago: formatAgo(d.updatedAt, locale) }) }}</span>
      </div>
    </div>
    <div class="dr__actions">
      <UiButton :size="36" :to="to" data-testid="my-draft-continue">{{
        t('myOffers.actions.continue')
      }}</UiButton>
      <UiButton
        variant="neutral"
        :size="36"
        data-testid="my-draft-remove"
        @click="confirmOpen = true"
        >{{ t('myOffers.actions.remove') }}</UiButton
      >
    </div>
    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="t('myOffers.removeDraft.title')"
      :text="t('myOffers.removeDraft.text', { title })"
      :confirm="t('myOffers.removeDraft.confirm')"
      danger
      @confirm="emit('remove')"
    />
  </article>
</template>

<style scoped>
.dr {
  padding: 14px;
  border-radius: var(--radius-l);
  background: var(--surface);
  display: grid;
  grid-template-columns: 144px minmax(0, 1fr) auto;
  grid-template-areas: 'photo body actions';
  column-gap: 16px;
  row-gap: 10px;
}

.dr__photo {
  grid-area: photo;
  display: block;
}

.dr__body {
  grid-area: body;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dr__title {
  font-size: 16px;
  line-height: 21px;
  font-weight: 500;
  color: var(--link);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.dr__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.dr__actions {
  grid-area: actions;
  align-self: end;
  display: flex;
  gap: 6px;
}

@media (max-width: 767px) {
  .dr {
    grid-template-columns: 96px minmax(0, 1fr);
    grid-template-areas:
      'photo body'
      'actions actions';
    column-gap: 12px;
    padding: 12px;
  }

  .dr__actions > :deep(*) {
    flex: 1 1 0;
  }
}
</style>
