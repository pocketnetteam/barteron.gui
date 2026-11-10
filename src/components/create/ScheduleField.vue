<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DraftDay } from '@/models/draft'
import UiCheckbox from '@/ui/UiCheckbox.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSwitch from '@/ui/UiSwitch.vue'

/**
 * Opening hours of a pickup point (s4-pvz): a row a day, Monday first, as the
 * old `day1…day7`. A closed day is left out of the offer; «Круглосуточно» is
 * the old `allDay`.
 */
const props = defineProps<{ days: DraftDay[]; error?: string }>()
const { t, locale } = useI18n()

/** «Пн»…«Вс»: 1 January 2024 was a Monday. */
const names = computed(() => {
  const format = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, i) => {
    const name = format.format(new Date(2024, 0, 1 + i))
    return name.charAt(0).toLocaleUpperCase(locale.value) + name.slice(1)
  })
})

const allDay = computed({
  get: () => props.days.every((d) => d.open && d.allDay),
  set: (on: boolean) => {
    props.days.forEach((d) => {
      d.allDay = on
      if (on) d.open = true
    })
  },
})

function copyMonday() {
  const monday = props.days[0]!
  props.days.slice(1, 5).forEach((d) => Object.assign(d, { ...monday }))
}
</script>

<template>
  <div class="sch" data-field="schedule">
    <div class="sch__head">
      <span class="sch__label">{{ t('create.point.schedule') }}</span>
      <button type="button" class="sch__copy" @click="copyMonday">
        {{ t('create.point.copyMonday') }}
      </button>
    </div>

    <ul class="sch__table" :class="{ 'sch__table--error': error }">
      <li
        v-for="(day, i) in days"
        :key="i"
        class="sch__row"
        :class="{ 'sch__row--off': !day.open }"
        :data-testid="`create-day-${i + 1}`"
      >
        <span class="sch__day">{{ names[i] }}</span>
        <UiSwitch v-model="day.open" :aria-label="t('create.point.works', { day: names[i] })" />
        <template v-if="day.open && day.allDay">
          <span class="sch__note">{{ t('create.point.roundTheClock') }}</span>
          <button type="button" class="sch__link" @click="day.allDay = false">
            {{ t('create.point.setHours') }}
          </button>
        </template>
        <template v-else-if="day.open">
          <input
            v-model="day.start"
            class="sch__time tabular"
            type="time"
            :aria-label="`${names[i]}: ${t('create.point.opens')}`"
          />
          <span class="sch__dash" aria-hidden="true">—</span>
          <input
            v-model="day.finish"
            class="sch__time tabular"
            type="time"
            :aria-label="`${names[i]}: ${t('create.point.closes')}`"
          />
        </template>
        <span v-else class="sch__note">{{ t('create.point.dayOff') }}</span>
      </li>
    </ul>

    <UiCheckbox v-model="allDay">{{ t('create.point.allDay') }}</UiCheckbox>
    <p v-if="error" class="sch__error" role="alert">
      <UiIcon name="error" :size="14" :stroke="2" />{{ error }}
    </p>
  </div>
</template>

<style scoped>
.sch {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sch__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sch__label {
  font-size: 13px;
  font-weight: 600;
}

.sch__copy,
.sch__link {
  border: 0;
  background: transparent;
  padding: 2px 4px;
  color: var(--link);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
}

.sch__copy:focus-visible,
.sch__link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.sch__table {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.sch__table--error {
  border-color: var(--danger);
}

.sch__row {
  min-height: 52px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sch__row + .sch__row {
  border-top: 1px solid var(--border);
}

.sch__row--off {
  background: var(--subtle);
}

.sch__day {
  width: 52px;
  font-size: 14px;
  font-weight: 600;
}

.sch__row--off .sch__day {
  color: var(--text3);
}

.sch__time {
  height: 36px;
  padding: 0 10px;
  border: 1.5px solid transparent;
  border-radius: 10px;
  background: var(--muted);
  color: var(--text);
  font: inherit;
  font-size: 14px;
}

.sch__time:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.sch__dash {
  color: var(--text3);
}

.sch__note {
  font-size: 13px;
  color: var(--text3);
}

.sch__error {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--danger);
}

@media (max-width: 767px) {
  .sch__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .sch__row {
    padding: 8px 10px;
    gap: 8px;
  }

  .sch__day {
    width: 32px;
  }

  .sch__time {
    padding: 0 6px;
  }
}
</style>
