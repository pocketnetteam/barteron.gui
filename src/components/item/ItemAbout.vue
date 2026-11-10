<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ItemSection from './ItemSection.vue'

/** «О товаре»: condition, category, how the price is set, the description. */
const props = defineProps<{
  facts: { label: string; value: string }[]
  description: string
}>()
const { t } = useI18n()

const text = ref<HTMLElement>()
const expanded = ref(false)
const long = ref(false)

/** «Показать полностью» only when the clamp actually cuts the text. */
async function measure() {
  await nextTick()
  const el = text.value
  long.value = !!el && el.scrollHeight > el.clientHeight + 2
}
onMounted(measure)
watch(() => props.description, measure)
</script>

<template>
  <ItemSection :title="t('item.about.title')" heading-id="item-about">
    <dl class="ia__facts">
      <div v-for="fact in facts" :key="fact.label" class="ia__fact">
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </div>
    </dl>
    <div v-if="description" class="ia__desc">
      <h3 class="ia__subtitle">{{ t('item.about.description') }}</h3>
      <p ref="text" class="ia__text" :class="{ 'ia__text--open': expanded }">{{ description }}</p>
      <button v-if="long && !expanded" type="button" class="ia__more" @click="expanded = true">
        {{ t('item.about.more') }}
      </button>
    </div>
  </ItemSection>
</template>

<style scoped>
.ia__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 24px;
}

.ia__fact dt {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.ia__fact dd {
  margin-top: 2px;
  font-size: 15px;
  line-height: 22px;
}

.ia__desc {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ia__subtitle {
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
}

.ia__text {
  font-size: 15px;
  line-height: 24px;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.ia__more {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

@media (min-width: 768px) {
  .ia__more {
    display: none;
  }
}

@media (max-width: 767px) {
  .ia__facts {
    grid-template-columns: 1fr 1fr;
  }

  .ia__text:not(.ia__text--open) {
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
