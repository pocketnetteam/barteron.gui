<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/** «Шаг 2 из 5» over the step's title. */
defineProps<{ n: number; total: number; title: string }>()
const { t } = useI18n()
</script>

<template>
  <div class="sh">
    <span class="sh__step">{{ t('create.stepOf', { n, total }) }}</span>
    <h1 class="sh__title">{{ title }}</h1>
  </div>
</template>

<style scoped>
.sh {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sh__step {
  font-size: 13px;
  font-weight: 600;
  color: var(--link);
}

.sh__title {
  margin: 0;
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
}

@media (max-width: 767px) {
  .sh__step {
    display: none;
  }

  .sh__title {
    font-size: 24px;
    line-height: 30px;
  }
}
</style>
