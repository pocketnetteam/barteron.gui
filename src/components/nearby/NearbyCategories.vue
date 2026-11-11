<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories } from '@/api/queries'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import { categoryRoute } from '@/composables/catalog-nav'
import { categoryIcon } from '@/config/category-icons'
import type { NearbyCategory } from '@/models/nearby'
import { useSessionStore } from '@/stores/session'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Что продают»: top-level categories of the offers around, the most first,
 * with a share bar and the newest photos. A tile opens the catalog of that
 * category in the same place.
 */
const props = defineProps<{ categories: readonly NearbyCategory[] }>()
const { t } = useI18n()
const names = useCategories()
const session = useSessionStore()

const FIRST = 8
const all = ref(false)
const shown = computed(() => (all.value ? props.categories : props.categories.slice(0, FIRST)))
const max = computed(() => props.categories[0]?.count ?? 1)

const photos = (c: NearbyCategory) =>
  c.offers
    .flatMap((o) =>
      o.images[0] ? [session.sdk?.manageBastyonImageSrc(o.images[0]) ?? o.images[0]] : []
    )
    .slice(0, 3)
</script>

<template>
  <div class="ncats" data-testid="nearby-categories">
    <ul class="ncats__grid">
      <li v-for="c in shown" :key="c.id">
        <RouterLink class="ncats__tile" :to="categoryRoute(c.id)" :data-category="c.id">
          <span class="ncats__head">
            <span class="ncats__icon"><UiIcon :name="categoryIcon(c.id)" :size="22" /></span>
            <span class="ncats__name">{{ names.label(c.id) ?? '' }}</span>
            <span class="ncats__count">{{ c.count }}</span>
          </span>
          <span class="ncats__bar" aria-hidden="true">
            <span
              class="ncats__fill"
              :style="{ width: `${Math.max(4, (c.count / max) * 100)}%` }"
            />
          </span>
          <span v-if="photos(c).length" class="ncats__photos">
            <OfferPhoto
              v-for="(src, i) in photos(c)"
              :key="i"
              class="ncats__photo"
              :src="src"
              ratio="1 / 1"
              radius="10px"
            />
          </span>
        </RouterLink>
      </li>
    </ul>
    <button
      v-if="categories.length > FIRST"
      type="button"
      class="ncats__more"
      :aria-expanded="all"
      @click="all = !all"
    >
      {{ all ? t('nearby.fewerCategories') : t('nearby.allCategories', { n: categories.length }) }}
      <UiIcon :name="all ? 'arrow-up' : 'arrow-down'" :size="16" :stroke="2" />
    </button>
  </div>
</template>

<style scoped>
.ncats {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.ncats__grid {
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.ncats__tile {
  box-sizing: border-box;
  height: 100%;
  padding: 16px;
  border-radius: var(--radius-l);
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ncats__tile:hover {
  text-decoration: none;
  box-shadow: var(--shadow-1);
}

.ncats__tile:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.ncats__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ncats__icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-m);
  background: var(--primary-soft);
  color: var(--link);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ncats__name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.ncats__count {
  flex: none;
  font-size: 20px;
  line-height: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ncats__bar {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--muted);
  overflow: hidden;
}

.ncats__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
}

.ncats__photos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.ncats__more {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.ncats__more:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}

@media (max-width: 1099px) {
  .ncats__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 899px) {
  .ncats__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Phone: one column, photos on the right. */
@media (max-width: 767px) {
  .ncats__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .ncats__tile {
    padding: 12px;
    border-radius: 14px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'head photos' 'bar photos';
    align-items: center;
    gap: 10px 12px;
  }

  .ncats__head {
    grid-area: head;
    gap: 10px;
  }

  .ncats__bar {
    grid-area: bar;
  }

  .ncats__photos {
    grid-area: photos;
    width: 104px;
    gap: 4px;
  }

  .ncats__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .ncats__name {
    font-size: 14px;
    line-height: 19px;
  }

  .ncats__count {
    font-size: 17px;
  }
}
</style>
