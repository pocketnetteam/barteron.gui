<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storageKeepsAll } from '@/lib/storage'
import UiButton from '@/ui/UiButton.vue'
import SystemState from './SystemState.vue'

/**
 * «Вышла новая версия Barteron» (s8-conflict-mobile): a piece of the app did
 * not load because a new version replaced the files. Nothing to close: the
 * page cannot go on without a restart. Drafts and favourites are in
 * localStorage, so they survive it — unless the browser would not take them,
 * and then the window says so. It lives in the main bundle, so it draws its
 * own overlay instead of the lazy-loaded dialog parts.
 */
const { t } = useI18n()
const button = ref<{ $el: HTMLElement } | null>(null)
const kept = storageKeepsAll()

onMounted(() => button.value?.$el.focus())

function restart() {
  window.location.reload()
}
</script>

<template>
  <Teleport to="body">
    <div class="vc">
      <div
        class="vc__panel"
        role="alertdialog"
        aria-modal="true"
        :aria-label="t('system.version.title')"
      >
        <span class="vc__grabber" aria-hidden="true" />
        <SystemState
          bare
          kind="version"
          icon="retry"
          tone="primary"
          :title="t('system.version.title')"
          :text="t('system.version.text')"
          :notes="[
            kept
              ? { ok: true, text: t('system.version.saved') }
              : { ok: false, text: t('system.version.notSaved') },
          ]"
        >
          <UiButton ref="button" block data-testid="version-restart" @click="restart">{{
            t('system.version.restart')
          }}</UiButton>
          <p class="vc__hint">{{ t('system.version.hint') }}</p>
        </SystemState>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.vc {
  position: fixed;
  z-index: var(--z-modal);
  inset: 0;
  padding: 16px;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
}

.vc__panel {
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  padding: 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-3);
  display: flex;
  flex-direction: column;
}

.vc__grabber {
  display: none;
  align-self: center;
  width: 36px;
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--border-strong);
}

.vc__hint {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
  text-align: center;
}

/* A bottom sheet on a phone, like the other windows. */
@media (max-width: 767px) {
  .vc {
    align-items: flex-end;
    padding: 48px 0 0;
  }

  .vc__panel {
    max-width: none;
    padding: 10px 16px calc(20px + env(safe-area-inset-bottom, 0px));
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    gap: 14px;
  }

  .vc__grabber {
    display: block;
  }
}
</style>
