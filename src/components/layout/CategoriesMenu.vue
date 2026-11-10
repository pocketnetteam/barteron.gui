<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories } from '@/api/queries'
import type { Category } from '@/models/categories'
import UiIcon from '@/ui/UiIcon.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'

/**
 * «Все категории» (s2-nav-desktop): top-level categories on the left, the
 * subcategories of the hovered one on the right. A title opens the whole
 * category.
 */
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const categories = useCategories()

const roots = computed(() => categories.tree.value?.roots() ?? [])
const activeId = ref<number | null>(null)
const active = computed(() => roots.value.find((c) => c.id === activeId.value) ?? roots.value[0])
const groups = computed(() => {
  const tree = categories.tree.value
  if (!tree || !active.value) return []
  return tree.children(active.value.id).map((child) => ({
    item: child,
    children: tree.children(child.id),
  }))
})

const name = (c: Category) => categories.label(c.id) ?? ''
const link = (c: Category) => ({ name: 'category', params: { id: String(c.id) } })
</script>

<template>
  <div class="mega" data-testid="categories-menu" @keydown.esc="emit('close')">
    <ul v-if="roots.length" class="mega__roots">
      <li v-for="root in roots" :key="root.id">
        <RouterLink
          class="mega__root"
          :class="{ 'mega__root--active': root.id === active?.id }"
          :to="link(root)"
          @mouseenter="activeId = root.id"
          @focus="activeId = root.id"
          @click="emit('close')"
        >
          <span>{{ name(root) }}</span>
          <UiIcon
            v-if="categories.tree.value?.hasChildren(root.id)"
            name="chevron-right"
            :size="16"
          />
        </RouterLink>
      </li>
    </ul>
    <div v-else class="mega__roots mega__roots--loading">
      <UiSkeleton v-for="i in 10" :key="i" height="20px" />
    </div>

    <div class="mega__panel">
      <RouterLink v-if="active" class="mega__title" :to="link(active)" @click="emit('close')">
        {{ name(active) }}<UiIcon name="chevron-right" :size="20" :stroke="2" />
      </RouterLink>
      <div class="mega__groups">
        <section v-for="group in groups" :key="group.item.id" class="mega__group">
          <RouterLink class="mega__group-title" :to="link(group.item)" @click="emit('close')">
            {{ name(group.item) }}
          </RouterLink>
          <RouterLink
            v-for="child in group.children"
            :key="child.id"
            class="mega__link"
            :to="link(child)"
            @click="emit('close')"
          >
            {{ name(child) }}
          </RouterLink>
        </section>
      </div>
      <p v-if="categories.error.value" class="mega__error">{{ t('catalog.categoriesFailed') }}</p>
    </div>
  </div>
</template>

<style scoped>
.mega {
  display: grid;
  grid-template-columns: 344px 1fr;
  max-height: calc(100vh - 140px);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  background: var(--surface);
  box-shadow: var(--shadow-3);
  overflow: hidden;
}

.mega__roots {
  margin: 0;
  padding: 16px 12px;
  list-style: none;
  border-right: 1px solid var(--border);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.mega__roots--loading {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
}

.mega__root {
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  color: var(--text);
  font-size: 14px;
  line-height: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-decoration: none;
}

.mega__root .ui-icon {
  color: var(--text3);
}

.mega__root:hover,
.mega__root--active {
  background: var(--primary-soft);
  color: var(--link);
  font-weight: 600;
  text-decoration: none;
}

.mega__panel {
  padding: 28px 32px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.mega__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text);
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
  text-decoration: none;
}

.mega__title:hover {
  color: var(--link);
  text-decoration: none;
}

.mega__groups {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 28px 40px;
}

.mega__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mega__group-title {
  color: var(--text);
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  text-decoration: none;
}

.mega__link {
  color: var(--text2);
  font-size: 14px;
  line-height: 18px;
  text-decoration: none;
}

.mega__group-title:hover,
.mega__link:hover {
  color: var(--link);
  text-decoration: none;
}

.mega__root:focus-visible,
.mega__title:focus-visible,
.mega__group-title:focus-visible,
.mega__link:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: 0 0 0 3px var(--ring);
}

.mega__error {
  color: var(--danger);
  font-size: 14px;
}
</style>
