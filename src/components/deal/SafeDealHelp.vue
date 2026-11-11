<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'

/**
 * «Как работает безопасная сделка»: the four questions of the old
 * `safe-deal-dialog`, shortened. Opens from the header, the home hint,
 * settings, the purchase dialog, the deal page and the deals list.
 */
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const QUESTIONS = [1, 2, 3, 4] as const
const paragraphs = (n: number) => t(`deal.help.a${n}`).split('\n\n')
</script>

<template>
  <UiDialog v-model:open="open" :title="t('deal.aside.how')" :width="560">
    <div class="sdh" data-testid="safe-deal-help">
      <section v-for="n in QUESTIONS" :key="n" class="sdh__item">
        <h3 class="sdh__q">{{ t(`deal.help.q${n}`) }}</h3>
        <p v-for="(p, i) in paragraphs(n)" :key="i" class="sdh__a">{{ p }}</p>
      </section>
    </div>
    <template #actions>
      <UiButton variant="neutral" @click="open = false">{{ t('ui.close') }}</UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.sdh {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sdh__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sdh__q {
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
}

.sdh__a {
  color: var(--text2);
  font-size: 14px;
  line-height: 20px;
}
</style>
