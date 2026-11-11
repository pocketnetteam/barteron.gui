<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BOT_LINKS } from '@/api/notify'
import ConfirmDialog from '@/components/item/ConfirmDialog.vue'
import type { NotifyChannel } from '@/api/notify'
import { useBotChannel } from '@/composables/notify'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiBadge from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'
import UiField from '@/ui/UiField.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiInput from '@/ui/UiInput.vue'
import UiSpinner from '@/ui/UiSpinner.vue'

/**
 * A Telegram or VK bot (s5-notify-desktop / -mobile, s5-states): connected —
 * test and disconnect; not connected — three steps; plus loading and errors.
 * `signing` — whether the host lets the app sign (asked once for the screen).
 */
const props = defineProps<{ channel: NotifyChannel; signing: boolean | null }>()
const { t } = useI18n()
const session = useSessionStore()
const confirmOpen = ref(false)
const bot = useBotChannel(props.channel, () => props.signing)

const ch = computed(() => props.channel)
const prefix = computed(() => (ch.value === 'telegram' ? '@' : 'vk.com/'))

function openBot() {
  bot.botOpened = true
  void session.sdk?.openExternalLink(BOT_LINKS[ch.value]).catch(() => undefined)
}
</script>

<template>
  <div class="bot" :data-testid="`bot-${ch}`" :data-state="bot.state">
    <div class="bot__head">
      <span class="bot__icon" :class="`bot__icon--${ch}`">
        <UiIcon v-if="ch === 'telegram'" name="telegram" :size="22" />
        <span v-else class="bot__vk">VK</span>
      </span>
      <div class="bot__titles">
        <span class="bot__title">{{ t(`notify.${ch}.title`) }}</span>
        <UiBadge v-if="bot.state === 'connected'" tone="success" dot data-testid="bot-connected">{{
          bot.subscription?.name
            ? `${t('notify.connected')} · ${prefix === '@' ? '@' : ''}${bot.subscription.name}`
            : t('notify.connected')
        }}</UiBadge>
        <UiBadge v-else-if="bot.state === 'disconnected'" tone="neutral">{{
          t('notify.notConnected')
        }}</UiBadge>
      </div>
      <div v-if="bot.state === 'connected'" class="bot__actions">
        <UiButton
          variant="secondary"
          :size="40"
          :loading="bot.test.kind === 'sending'"
          data-testid="bot-test"
          @click="bot.sendTest()"
        >
          <span class="bot__wide">{{ t('notify.test') }}</span>
          <span class="bot__narrow">{{ t('notify.testShort') }}</span>
        </UiButton>
        <UiButton
          variant="danger-text"
          :size="40"
          :disabled="bot.busy"
          data-testid="bot-disconnect"
          @click="confirmOpen = true"
          >{{ t('notify.disconnect') }}</UiButton
        >
      </div>
    </div>

    <div v-if="bot.state === 'loading' || bot.state === 'idle'" class="bot__loading">
      <UiSpinner :size="18" /> {{ t('notify.loading') }}
    </div>

    <p v-else-if="bot.state === 'permission'" class="bot__waiting">{{ t('notify.needSigning') }}</p>

    <UiAlert v-else-if="bot.state === 'error'" tone="danger" live data-testid="bot-error">
      {{ t('notify.error', { error: bot.error }) }}
      <template #action>
        <UiButton variant="on-danger" :size="36" @click="bot.load()">{{
          t('notify.reload')
        }}</UiButton>
      </template>
    </UiAlert>

    <template v-else-if="bot.state === 'connected'">
      <UiAlert v-if="bot.test.kind === 'sent'" tone="success" live data-testid="bot-test-sent">{{
        t('notify.testSent')
      }}</UiAlert>
      <UiAlert
        v-else-if="bot.test.kind === 'failed'"
        tone="danger"
        live
        data-testid="bot-test-failed"
        >{{ t('notify.testFailed', { reason: bot.test.reason }) }}</UiAlert
      >
    </template>

    <ol v-else-if="bot.state === 'disconnected'" class="bot__steps">
      <li class="bot__step">
        <span class="bot__num" :class="{ 'bot__num--done': bot.botOpened }">
          <UiIcon v-if="bot.botOpened" name="check" :size="14" :stroke="2.6" />
          <template v-else>1</template>
        </span>
        <div class="bot__step-body">
          <span>{{ t(`notify.${ch}.step1`) }}</span>
          <button type="button" class="bot__link" @click="openBot">
            {{ t('notify.openBot') }} ↗
          </button>
        </div>
      </li>
      <li class="bot__step">
        <span class="bot__num bot__num--current">2</span>
        <div class="bot__step-body">
          <UiField :label="t(`notify.${ch}.step2`)" :error="bot.inputError">
            <UiInput
              v-model="bot.input"
              :prefix="prefix"
              :placeholder="t(`notify.${ch}.placeholder`)"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              :data-testid="`bot-input-${ch}`"
              @keydown.enter="bot.connect()"
            />
          </UiField>
        </div>
      </li>
      <li class="bot__step">
        <span class="bot__num">3</span>
        <div class="bot__step-body">
          <span>{{ t(`notify.${ch}.step3`) }}</span>
          <UiButton
            class="bot__connect"
            :size="44"
            :loading="bot.busy"
            data-testid="bot-connect"
            @click="bot.connect()"
            >{{ t(`notify.${ch}.connect`) }}</UiButton
          >
        </div>
      </li>
    </ol>

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="t(`notify.${ch}.disconnectTitle`)"
      :text="t(`notify.${ch}.disconnectText`)"
      :confirm="t('notify.disconnect')"
      :cancel="t('ui.cancel')"
      danger
      @confirm="bot.disconnect()"
    />
  </div>
</template>

<style scoped>
.bot {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bot__head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bot__icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-m);
  background: var(--info-soft);
  color: var(--info);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bot__vk {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.bot__titles {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.bot__title {
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
}

.bot__actions {
  display: flex;
  gap: 8px;
}

.bot__narrow {
  display: none;
}

.bot__waiting {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text3);
}

.bot__loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text2);
}

.bot__steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bot__step {
  display: flex;
  gap: 12px;
}

.bot__num {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text2);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bot__num--current {
  background: var(--primary);
  color: #ffffff;
}

.bot__num--done {
  background: var(--success-soft);
  color: var(--success);
}

.bot__step-body {
  flex: 1;
  min-width: 0;
  max-width: 420px;
  padding-top: 4px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  font-size: 15px;
  line-height: 20px;
}

.bot__step-body > :deep(.ui-field) {
  align-self: stretch;
}

.bot__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 400 14px / 20px var(--font-sans);
  cursor: pointer;
}

.bot__link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
  border-radius: 4px;
}

@media (max-width: 767px) {
  .bot__head {
    flex-wrap: wrap;
  }

  .bot__actions {
    flex-basis: 100%;
  }

  .bot__actions > :deep(*) {
    flex: 1 1 0;
  }

  .bot__wide {
    display: none;
  }

  .bot__narrow {
    display: inline;
  }

  .bot__connect {
    align-self: stretch;
  }
}
</style>
