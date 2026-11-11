<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMyAccount } from '@/composables/my-account'
import MyListCard from './MyListCard.vue'
import SectionHead from './SectionHead.vue'

/** «Мой список обмена» on its own (the phone cabinet has it as an item; on a computer it is in the settings). */
const { t } = useI18n()
const account = useMyAccount()
</script>

<template>
  <section class="mls" data-testid="cabinet-mylist">
    <SectionHead :title="t('cabinet.sections.mylist')" :text="t('settings.mylist.text')" />
    <div class="mls__card"><MyListCard :account="account" untitled /></div>
  </section>
</template>

<style scoped>
.mls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mls__card {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
}

@media (max-width: 767px) {
  .mls__card {
    padding: 18px;
  }
}
</style>
