<script setup lang="ts">
import { useI18n } from 'vue-i18n'

export interface CalcRow {
  label: string
  value: string
  /** The total: bold, under a line. */
  total?: boolean
}

/** «Расчёт» of a deal: price, fee, who pays it, what goes where (s7-dealbuyer, s7-dealvalidator). */
defineProps<{ rows: CalcRow[]; note?: string; noteTone?: 'success' | 'muted' }>()
const { t } = useI18n()
</script>

<template>
  <div class="dc" data-testid="deal-calc">
    <h3 class="dc__title">{{ t('deal.form.calc') }}</h3>
    <dl class="dc__rows">
      <div
        v-for="row in rows"
        :key="row.label"
        class="dc__row"
        :class="{ 'dc__row--total': row.total }"
      >
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
    <p v-if="note" class="dc__note" :class="`dc__note--${noteTone ?? 'muted'}`">{{ note }}</p>
  </div>
</template>

<style scoped>
.dc {
  max-width: 556px;
  padding: 18px;
  border-radius: var(--radius-l);
  background: var(--page);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dc__title {
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
}

.dc__rows {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dc__row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 14px;
  line-height: 20px;
}

.dc__row dt {
  color: var(--text2);
}

.dc__row dd {
  margin: 0;
  text-align: right;
}

.dc__row--total {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 17px;
  line-height: 24px;
  font-weight: 700;
}

.dc__row--total dt {
  color: var(--text);
}

.dc__note {
  font-size: 13px;
  line-height: 18px;
}

.dc__note--success {
  color: var(--success);
}

.dc__note--muted {
  color: var(--text2);
}
</style>
