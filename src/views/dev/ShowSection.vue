<script setup lang="ts">
/** A white block of the showcase, like the sections of the prototype sheets. */
defineProps<{ title?: string; note?: string; caption?: string }>()
</script>

<template>
  <section class="show">
    <div v-if="title || note || $slots.aside" class="show__head">
      <h2 v-if="title" class="show__title">{{ title }}</h2>
      <span v-if="note" class="show__note">{{ note }}</span>
      <slot name="aside" />
    </div>
    <span v-if="caption" class="show__caption">{{ caption }}</span>
    <slot />
  </section>
</template>

<style scoped>
.show {
  min-width: 0;
  padding: 32px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.show__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px 24px;
}

.show__title {
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
}

.show__note {
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.show__caption {
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: var(--text3);
}

@media (max-width: 767px) {
  .show {
    padding: 20px 16px;
    border-radius: var(--radius-l);
  }
}
</style>
