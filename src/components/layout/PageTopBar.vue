<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * Phone top bar of an inner screen (s5-myoffers-mobile, s5-notify-mobile):
 * back, the title, actions on the right. Back goes where history goes; when
 * the screen was opened by a link, it goes to `back`.
 */
const props = defineProps<{ title?: string; back?: RouteLocationRaw | null }>()
const { t } = useI18n()
const router = useRouter()

function goBack() {
  const state = router.options.history.state as { back?: string | null } | undefined
  if (state?.back) router.back()
  else if (props.back) void router.replace(props.back)
}
</script>

<template>
  <div class="ptop">
    <button
      v-if="back"
      type="button"
      class="ptop__btn"
      :aria-label="t('ui.back')"
      data-testid="top-back"
      @click="goBack"
    >
      <UiIcon name="back" :size="24" :stroke="2" />
    </button>
    <span class="ptop__title">{{ title }}</span>
    <div v-if="$slots.default" class="ptop__end"><slot /></div>
  </div>
</template>

<style scoped>
.ptop {
  min-height: 56px;
  box-sizing: border-box;
  /* The host close button may sit at the top right (lib/host-insets.ts). */
  padding: 6px max(8px, var(--host-corner, 0px)) 6px 8px;
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 4px;
}

.ptop__btn {
  flex: none;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-m);
  background: transparent;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ptop__btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.ptop__title {
  flex: 1;
  min-width: 0;
  padding-left: 8px;
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ptop__btn + .ptop__title {
  padding-left: 4px;
}

.ptop__end {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
