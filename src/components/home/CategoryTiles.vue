<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { categoryRoute } from '@/composables/catalog-nav'
import { categoryIcon } from '@/config/category-icons'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * Category tiles of the home page (s2-home): thirteen on the desktop, seven on
 * the phone, then «Все категории». Short names are ours: the full ones
 * («Транспорт, запчасти, аксессуары») do not fit a tile.
 */
defineEmits<{ all: [] }>()
const { t } = useI18n()

interface Tile {
  id: number
  key: string
  /** Also on the phone. */
  phone?: true
}

const TILES: Tile[] = [
  { id: 6000, key: 'transport', phone: true },
  { id: 10542, key: 'realty' },
  { id: 7000, key: 'electronics', phone: true },
  { id: 11450, key: 'clothes', phone: true },
  { id: 11700, key: 'home', phone: true },
  { id: 2984, key: 'kids', phone: true },
  { id: 2, key: 'services', phone: true },
  { id: 1000, key: 'bikes', phone: true },
  { id: 888, key: 'sport' },
  { id: 24, key: 'animals' },
  { id: 267, key: 'books' },
  { id: 1, key: 'collect' },
  { id: 13587, key: 'food' },
]
</script>

<template>
  <nav class="tiles" :aria-label="t('home.categories')" data-testid="category-tiles">
    <RouterLink
      v-for="tile in TILES"
      :key="tile.id"
      class="tiles__item"
      :class="{ 'tiles__item--desktop': !tile.phone }"
      :to="categoryRoute(tile.id)"
    >
      <span class="tiles__name tiles__name--full">{{ t(`tiles.${tile.key}.full`) }}</span>
      <span class="tiles__name tiles__name--short">{{ t(`tiles.${tile.key}.short`) }}</span>
      <span class="tiles__icon"
        ><UiIcon :name="categoryIcon(tile.id)" :size="24" :stroke="1.7"
      /></span>
    </RouterLink>
    <button type="button" class="tiles__item tiles__item--all" @click="$emit('all')">
      <span class="tiles__name tiles__name--full">{{ t('header.allCategories') }}</span>
      <span class="tiles__name tiles__name--short">{{ t('tiles.all') }}</span>
      <span class="tiles__icon">
        <UiIcon class="tiles__all-desktop" name="chevron-right" :size="22" :stroke="2" />
        <UiIcon class="tiles__all-phone" name="tiles" :size="22" />
      </span>
    </button>
  </nav>
</template>

<style scoped>
.tiles {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}

.tiles__item {
  box-sizing: border-box;
  min-height: 116px;
  padding: 14px;
  border: 0;
  border-radius: var(--radius-l);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: left;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.tiles__item:hover {
  text-decoration: none;
  box-shadow: var(--shadow-1);
}

.tiles__item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.tiles__name {
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
}

.tiles__name--short,
.tiles__all-phone {
  display: none;
}

.tiles__icon {
  align-self: flex-end;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-m);
  background: var(--primary-soft);
  color: var(--link);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tiles__item--all {
  color: var(--link);
  box-shadow: inset 0 0 0 1.5px var(--border);
  cursor: pointer;
}

.tiles__item--all .tiles__icon {
  background: var(--muted);
  color: var(--text);
}

@media (max-width: 1099px) {
  .tiles {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

/* Phone: four in a row, icon above a short name. */
@media (max-width: 767px) {
  .tiles {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .tiles__item--desktop,
  .tiles__name--full,
  .tiles__all-desktop {
    display: none;
  }

  .tiles__name--short,
  .tiles__all-phone {
    display: block;
  }

  .tiles__item {
    min-height: 84px;
    padding: 10px 4px 8px;
    border-radius: 14px;
    flex-direction: column-reverse;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    text-align: center;
  }

  .tiles__name {
    font-size: 11px;
    line-height: 13px;
    font-weight: 500;
  }

  .tiles__icon {
    align-self: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .tiles__item--all .tiles__name {
    font-weight: 600;
  }
}
</style>
