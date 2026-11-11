<script setup lang="ts">
/**
 * Title of a cabinet section with its actions on the right. On a phone the
 * title is in the top bar, so only the subtitle and actions stay here.
 */
defineProps<{ title: string; text?: string }>()
</script>

<template>
  <div class="shead" :class="{ 'shead--bare': !$slots.default && !text }">
    <div class="shead__row">
      <h1 class="shead__title">{{ title }}</h1>
      <div v-if="$slots.default" class="shead__actions"><slot /></div>
    </div>
    <p v-if="text" class="shead__text">{{ text }}</p>
  </div>
</template>

<style scoped>
.shead {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shead__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.shead__title {
  margin: 0;
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
}

.shead__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shead__text {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

@media (max-width: 767px) {
  .shead__title {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* Only the hidden title is left: take no room in the column. */
  .shead--bare {
    position: absolute;
  }

  .shead__actions {
    flex: 1;
  }
}
</style>
