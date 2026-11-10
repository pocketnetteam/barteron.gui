<script setup lang="ts">
import { computed, h } from 'vue'
import { ICONS, type IconDef, type IconName } from './icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    /** 16 / 20 / 24 by the guidelines; other sizes are allowed for photos and empty states. */
    size?: number | string
    /** Stroke width; the base is 1.8, small icons use 2–3. */
    stroke?: number | string
  }>(),
  { size: 24, stroke: 1.8 }
)

const def = computed<IconDef>(() => ICONS[props.name])

function Paths() {
  return def.value.els.map(([tag, attrs]) => h(tag, attrs))
}
</script>

<template>
  <svg
    class="ui-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="def.fill ? 'currentColor' : 'none'"
    :stroke="def.fill ? undefined : 'currentColor'"
    :stroke-width="def.fill ? undefined : stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <Paths />
  </svg>
</template>

<style scoped>
.ui-icon {
  flex: none;
}
</style>
