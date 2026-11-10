<script setup lang="ts">
import { ref, watch } from 'vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * Photo area of a card, 4:3 by default. Without a photo (or if it fails to
 * load) shows a neutral placeholder. Badges go into the corner slots.
 */
const props = withDefaults(
  defineProps<{
    src?: string | null
    ratio?: string
    radius?: string
    /** Number of photos: dots at the bottom, up to 5. */
    count?: number
    /** Grey and faded: inactive offer. */
    inactive?: boolean
    /** Violet outline: matches my offers. */
    highlight?: boolean
  }>(),
  { ratio: '4 / 3', radius: 'var(--radius-m)', count: 0 }
)

const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false)
)
</script>

<template>
  <div
    class="photo"
    :class="{ 'photo--inactive': inactive, 'photo--highlight': highlight }"
    :style="{ aspectRatio: ratio, borderRadius: radius }"
  >
    <img
      v-if="src && !failed"
      class="photo__img"
      :src="src"
      alt=""
      loading="lazy"
      decoding="async"
      @error="failed = true"
    />
    <UiIcon v-else class="photo__placeholder" name="image" :size="36" :stroke="1.4" />

    <div v-if="$slots['top-left']" class="photo__corner photo__corner--tl">
      <slot name="top-left" />
    </div>
    <div v-if="$slots['top-right']" class="photo__corner photo__corner--tr">
      <slot name="top-right" />
    </div>
    <div v-if="$slots['bottom-left']" class="photo__corner photo__corner--bl">
      <slot name="bottom-left" />
    </div>
    <div v-if="count > 1" class="photo__dots" aria-hidden="true">
      <span
        v-for="i in Math.min(count, 5)"
        :key="i"
        class="photo__dot"
        :class="{ 'photo__dot--on': i === 1 }"
      />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.photo {
  position: relative;
  overflow: hidden;
  background: var(--photo);
  color: var(--text3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo--highlight {
  overflow: visible;
  box-shadow: 0 0 0 2px var(--primary);
}

.photo__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.photo--inactive {
  filter: grayscale(1);
}

.photo__corner {
  position: absolute;
  display: flex;
  gap: 4px;
}

.photo__corner--tl {
  left: 8px;
  top: 8px;
}

.photo__corner--tr {
  right: 6px;
  top: 6px;
}

.photo__corner--bl {
  left: 8px;
  bottom: 8px;
}

.photo__dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.photo__dot {
  width: 16px;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.5);
}

.photo__dot--on {
  background: #ffffff;
}
</style>
