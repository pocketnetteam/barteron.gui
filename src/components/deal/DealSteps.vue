<script setup lang="ts">
/** «Выполните действия»: numbered steps (s7-dealmatrix). */
defineProps<{ steps: string[] }>()
</script>

<template>
  <ol class="dst">
    <li v-for="(step, i) in steps" :key="i" class="dst__item">
      <span class="dst__num" aria-hidden="true">{{ i + 1 }}</span>
      <span>{{ step }}</span>
    </li>
  </ol>
</template>

<style scoped>
.dst {
  display: flex;
  flex-direction: column;
  gap: 10px;
  counter-reset: none;
}

.dst__item {
  display: flex;
  gap: 12px;
  font-size: 15px;
  line-height: 22px;
}

.dst__num {
  width: 24px;
  height: 24px;
  margin-top: -1px;
  flex: none;
  border-radius: 50%;
  background: var(--muted);
  color: var(--text2);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
}
</style>
