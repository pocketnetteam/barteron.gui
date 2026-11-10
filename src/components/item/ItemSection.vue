<script setup lang="ts">
/** A white block of the offer page: title, a line under it, a link on the right. */
defineProps<{ title?: string; subtitle?: string; headingId?: string }>()
</script>

<template>
  <section class="isec" :aria-labelledby="title ? headingId : undefined">
    <header v-if="title || $slots.end" class="isec__head">
      <div class="isec__titles">
        <h2 v-if="title" :id="headingId" class="isec__title">{{ title }}</h2>
        <p v-if="subtitle" class="isec__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.end" class="isec__end"><slot name="end" /></div>
    </header>
    <slot />
  </section>
</template>

<style scoped>
.isec {
  padding: 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.isec__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.isec__titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.isec__title {
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
}

.isec__subtitle {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.isec__end {
  flex: none;
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

@media (max-width: 767px) {
  .isec {
    padding: 20px 16px;
    border-radius: var(--radius-l);
    gap: 12px;
  }

  .isec__head {
    flex-wrap: wrap;
    gap: 4px 16px;
  }

  .isec__title {
    font-size: 18px;
    line-height: 24px;
  }
}
</style>
