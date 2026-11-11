<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories, useUserProfiles } from '@/api/queries'
import { shortHash } from '@/lib/format'
import type { NearbySeller } from '@/models/nearby'
import { useSessionStore } from '@/stores/session'
import UiAvatar from '@/ui/UiAvatar.vue'

/** «Кто продаёт больше всего»: sellers with the most offers around, to their profiles. */
const props = defineProps<{ sellers: readonly NearbySeller[] }>()
const { t } = useI18n()
const session = useSessionStore()
const categories = useCategories()
const profiles = useUserProfiles(() => props.sellers.map((s) => s.address))

const rows = computed(() =>
  props.sellers.map((s) => {
    const profile = profiles.data.value?.get(s.address)
    const image = profile?.image
    return {
      ...s,
      name: profile?.name || shortHash(s.address),
      avatar: image ? (session.sdk?.manageBastyonImageSrc(image) ?? image) : null,
      what: s.categories
        .slice(0, 2)
        .map((id) => categories.label(id))
        .filter(Boolean)
        .join(', '),
    }
  })
)
</script>

<template>
  <ul class="nsell" data-testid="nearby-sellers">
    <li v-for="s in rows" :key="s.address">
      <RouterLink class="nsell__row" :to="{ name: 'profile', params: { id: s.address } }">
        <UiAvatar :name="s.name" :seed="s.address" :src="s.avatar" :size="48" />
        <span class="nsell__body">
          <span class="nsell__name">{{ s.name }}</span>
          <span class="nsell__meta">
            {{ t('nearby.offersCount', { n: s.count }, s.count)
            }}<template v-if="s.what"> · {{ s.what }}</template>
          </span>
        </span>
      </RouterLink>
    </li>
  </ul>
</template>

<style scoped>
.nsell {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 8px 12px;
}

.nsell__row {
  padding: 12px;
  border-radius: var(--radius-l);
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
}

.nsell__row:hover {
  text-decoration: none;
  box-shadow: var(--shadow-1);
}

.nsell__row:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.nsell__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nsell__name {
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  color: var(--link);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsell__meta {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
