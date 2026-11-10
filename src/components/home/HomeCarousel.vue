<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * A row of cards that scrolls sideways (s2-home: «Может подойти», «Вы
 * смотрели»). Arrows on the desktop, a swipe on the phone.
 */
withDefaults(defineProps<{ arrows?: boolean; label: string }>(), { arrows: false })
const { t } = useI18n()
const track = ref<HTMLElement>()
const atStart = ref(true)
const atEnd = ref(true)

function update() {
  const el = track.value
  if (!el) return
  atStart.value = el.scrollLeft <= 2
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
}

function step(direction: 1 | -1) {
  const el = track.value
  if (!el) return
  el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
}

let observer: ResizeObserver | null = null
onMounted(() => {
  update()
  if (typeof ResizeObserver !== 'undefined' && track.value) {
    observer = new ResizeObserver(update)
    observer.observe(track.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
defineExpose({ update })
</script>

<template>
  <div class="carousel">
    <div v-if="arrows && !(atStart && atEnd)" class="carousel__arrows">
      <button
        type="button"
        class="carousel__arrow"
        :aria-label="t('home.prev')"
        :disabled="atStart"
        @click="step(-1)"
      >
        <UiIcon name="chevron-left" :size="20" :stroke="2" />
      </button>
      <button
        type="button"
        class="carousel__arrow"
        :aria-label="t('home.next')"
        :disabled="atEnd"
        @click="step(1)"
      >
        <UiIcon name="chevron-right" :size="20" :stroke="2" />
      </button>
    </div>
    <div
      ref="track"
      class="carousel__track"
      role="list"
      :aria-label="label"
      @scroll.passive="update"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.carousel {
  position: relative;
}

.carousel__arrows {
  position: absolute;
  right: 0;
  top: -60px;
  display: flex;
  gap: 8px;
}

.carousel__arrow {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel__arrow:disabled {
  color: var(--text3);
  cursor: default;
}

.carousel__arrow:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.carousel__track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

.carousel__track::-webkit-scrollbar {
  display: none;
}

.carousel__track > :deep(*) {
  scroll-snap-align: start;
}

@media (max-width: 767px) {
  .carousel__arrows {
    display: none;
  }

  .carousel__track {
    gap: 10px;
    margin: 0 -16px;
    padding: 0 16px;
    scroll-padding: 0 16px;
  }
}
</style>
