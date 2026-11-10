<script setup lang="ts">
/**
 * Page frame. Desktop and tablet (≥ 768 px): the header. Phone: the page's own
 * top bar (search, back button…) and the tab bar fixed at the bottom.
 */
</script>

<template>
  <div class="shell">
    <div v-if="$slots.header" class="shell__header"><slot name="header" /></div>
    <div v-if="$slots['mobile-top']" class="shell__mobile-top"><slot name="mobile-top" /></div>
    <main class="shell__main" :class="{ 'shell__main--tabbar': $slots.tabbar }">
      <slot />
    </main>
    <div v-if="$slots.tabbar" class="shell__tabbar"><slot name="tabbar" /></div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.shell__main {
  flex: 1;
  min-width: 0;
}

.shell__mobile-top,
.shell__tabbar {
  display: none;
}

@media (max-width: 767px) {
  .shell__header {
    display: none;
  }

  .shell__mobile-top {
    display: block;
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    border-bottom: 1px solid var(--border);
  }

  .shell__tabbar {
    display: block;
    position: fixed;
    z-index: var(--z-tabbar);
    left: 0;
    right: 0;
    bottom: 0;
  }

  .shell__main--tabbar {
    padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
  }
}
</style>
