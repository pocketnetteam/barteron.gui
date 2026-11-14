<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ProfileReview } from '@/composables/profile-reviews'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiRating from '@/ui/UiRating.vue'

/** Reviews about a seller: author, stars, date and the offer, text (s5-profile «Последние отзывы»). */
defineProps<{ rows: ProfileReview[]; avatars?: boolean }>()
const { t } = useI18n()
</script>

<template>
  <ul class="rl" data-testid="review-list">
    <li v-for="row in rows" :key="row.id" class="rl__item">
      <UiAvatar v-if="avatars" :name="row.name" :seed="row.seed" :src="row.avatar" :size="40" />
      <div class="rl__body">
        <div class="rl__head">
          <span class="rl__name">{{ row.name }}</span>
          <UiRating v-if="row.stars" :value="row.stars" hide-value />
          <span class="rl__meta">
            {{ row.date }}
            <template v-if="row.offer.title">
              ·
              <RouterLink
                class="rl__offer"
                :to="{ name: 'barterItem', params: { id: row.offer.id } }"
                >{{ row.offer.title }}</RouterLink
              >
            </template>
          </span>
        </div>
        <p v-if="row.text" class="rl__text">{{ row.text }}</p>
        <p v-else class="rl__text rl__text--empty">{{ t('reviewsAbout.onlyScore') }}</p>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.rl {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rl__item {
  padding: 16px 0;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 12px;
}

.rl__item:first-child {
  border-top: 0;
}

.rl__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rl__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.rl__name {
  min-width: 0;
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.rl__meta {
  min-width: 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
  /* The offer's caption may be one long word. */
  overflow-wrap: anywhere;
}

.rl__offer {
  color: var(--text3);
}

.rl__text {
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.rl__text--empty {
  color: var(--text3);
}
</style>
