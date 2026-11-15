<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Нет связи с сетью» (s8-system-desktop, «Нода не отвечает»): over what was
 * already loaded, which stays on screen. «Повторить» asks the node again for
 * everything on the page; the first answer takes the banner away.
 */
/** `device` — the device itself is offline, not the node silent. */
defineProps<{ device?: boolean }>()
const { t } = useI18n()
const client = useQueryClient()
const retrying = ref(false)

async function retry() {
  retrying.value = true
  await client.refetchQueries({ type: 'active' }).catch(() => undefined)
  retrying.value = false
}
</script>

<template>
  <div class="net container" role="alert" data-testid="net-banner">
    <div class="net__box">
      <span class="net__mark" aria-hidden="true"
        ><UiIcon name="exchange" :size="22" :stroke="2"
      /></span>
      <div class="net__body">
        <strong class="net__title">{{ t('system.offline.title') }}</strong>
        <span class="net__text">{{
          device ? t('system.offline.device') : t('system.offline.text')
        }}</span>
        <span class="net__notes">
          <span class="net__note"><span class="net__dot" />{{ t('system.offline.saved') }}</span>
          <span class="net__note"
            ><span class="net__dot net__dot--wait" />{{ t('system.offline.waits') }}</span
          >
        </span>
      </div>
      <UiButton
        class="net__retry"
        variant="neutral"
        :size="40"
        icon="retry"
        :loading="retrying"
        data-testid="net-retry"
        @click="retry"
        >{{ t('ui.retry') }}</UiButton
      >
    </div>
  </div>
</template>

<style scoped>
.net {
  padding-top: 16px;
}

.net__box {
  padding: 16px 20px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--border);
  display: flex;
  align-items: center;
  gap: 16px;
}

.net__mark {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--danger-soft);
  color: var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
}

.net__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.net__title {
  font-size: 16px;
  line-height: 22px;
}

.net__text {
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.net__notes {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}

.net__note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  line-height: 18px;
}

.net__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--success);
}

.net__dot--wait {
  background: var(--warning);
}

.net__retry {
  flex: none;
}

@media (max-width: 767px) {
  .net {
    padding-top: 12px;
  }

  .net__box {
    flex-wrap: wrap;
    padding: 14px 16px;
    gap: 12px;
  }

  .net__mark {
    width: 40px;
    height: 40px;
  }

  .net__body {
    flex-basis: calc(100% - 56px);
  }

  .net__retry {
    flex: 1;
  }
}
</style>
