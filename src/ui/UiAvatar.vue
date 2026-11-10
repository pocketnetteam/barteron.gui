<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { avatarColor, initials } from './avatar'
import UiIcon from './UiIcon.vue'

const props = withDefaults(
  defineProps<{
    name?: string
    src?: string | null
    /** 64 / 56 / 48 / 40 / 32 / 24 */
    size?: 24 | 32 | 40 | 48 | 56 | 64
    /** Picks the colour; use the address so the colour does not change with the name. */
    seed?: string
    role?: 'guarantor' | 'moderator'
  }>(),
  { size: 48 }
)

const { t } = useI18n()
const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false)
)

const FONT: Record<number, number> = { 24: 11, 32: 13, 40: 15, 48: 18, 56: 20, 64: 24 }
const color = computed(() => avatarColor(props.seed ?? props.name))
const text = computed(() => initials(props.name))
const showImage = computed(() => !!props.src && !failed.value)
</script>

<template>
  <span class="ui-avatar" :style="{ width: `${size}px`, height: `${size}px` }">
    <img
      v-if="showImage"
      class="ui-avatar__img"
      :src="src!"
      alt=""
      loading="lazy"
      @error="failed = true"
    />
    <span
      v-else
      class="ui-avatar__initials"
      :style="{ background: color.bg, color: color.fg, fontSize: `${FONT[size]}px` }"
      aria-hidden="true"
    >
      {{ text }}
    </span>
    <span
      v-if="role"
      class="ui-avatar__role"
      :class="`ui-avatar__role--${role}`"
      :style="{ width: size >= 48 ? '20px' : '16px', height: size >= 48 ? '20px' : '16px' }"
      role="img"
      :aria-label="t(`ui.role.${role}`)"
    >
      <UiIcon
        :name="role === 'guarantor' ? 'check' : 'shield'"
        :size="size >= 48 ? 11 : 9"
        :stroke="3"
      />
    </span>
  </span>
</template>

<style scoped>
.ui-avatar {
  position: relative;
  flex: none;
  display: inline-block;
}

.ui-avatar__img,
.ui-avatar__initials {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-full);
}

.ui-avatar__img {
  object-fit: cover;
  background: var(--photo);
}

.ui-avatar__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  line-height: 1;
}

.ui-avatar__role {
  position: absolute;
  right: -2px;
  bottom: -2px;
  box-sizing: border-box;
  border-radius: var(--radius-full);
  border: 2px solid var(--surface);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-avatar__role--guarantor {
  background: var(--success);
}

.ui-avatar__role--moderator {
  background: var(--info);
}
</style>
