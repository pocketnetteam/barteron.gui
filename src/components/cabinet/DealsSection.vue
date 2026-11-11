<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DealRow from '@/components/deal/DealRow.vue'
import { cabinetRoute } from '@/composables/cabinet'
import { usePeople } from '@/composables/exchanges'
import { useMyAccount } from '@/composables/my-account'
import { useDealList } from '@/composables/safe-deal'
import { DEFAULT_GUARANTOR_FEE_PERCENT, isGuarantor } from '@/config/roles'
import { guarantorState } from '@/models/account'
import { isDealFinished, type DealRole } from '@/models/safe-deal'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'
import UiAlert from '@/ui/UiAlert.vue'
import UiBadge from '@/ui/UiBadge.vue'
import UiChip from '@/ui/UiChip.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiTabs from '@/ui/UiTabs.vue'
import SectionHead from './SectionHead.vue'

/**
 * «Безопасные сделки» in the cabinet (`#deals`, s7-deals-desktop; new — the
 * old app opened a deal only by its link): the deals started or opened on
 * this device, their status from the chain, the move that is mine.
 */
const { t, locale } = useI18n()
const session = useSessionStore()
const ui = useUiStore()
const list = useDealList()
const me = computed(() => session.address)

// ─── Guarantor card ─────────────────────────────────────────────────────────
const guarantor = computed(() => isGuarantor(me.value))
const account = useMyAccount()
const myGuarantor = computed(() =>
  account.shown.value ? guarantorState(account.shown.value, DEFAULT_GUARANTOR_FEE_PERCENT) : null
)
const pct = (value: number) =>
  new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value)

// ─── Tabs and filters ───────────────────────────────────────────────────────
const tab = ref<'active' | 'done'>('active')
const role = ref<DealRole | 'all'>('all')
const finished = (i: (typeof list.items.value)[number]) =>
  !!i.state && isDealFinished(i.state.status)
const activeItems = computed(() => list.items.value.filter((i) => !finished(i)))
const doneItems = computed(() => list.items.value.filter(finished))
const tabs = computed(() => [
  { value: 'active' as const, label: t('deals.tabs.active'), count: activeItems.value.length },
  { value: 'done' as const, label: t('deals.tabs.done'), count: doneItems.value.length },
])
const ROLES: (DealRole | 'all')[] = ['all', 'buyer', 'seller', 'validator']
const shown = computed(() =>
  (tab.value === 'active' ? activeItems.value : doneItems.value).filter(
    (i) => role.value === 'all' || i.role === role.value
  )
)

const addresses = computed(() =>
  list.items.value.flatMap((i) => [i.deal.buyer, i.deal.validator, i.offer?.address ?? ''])
)
const people = usePeople(addresses)
const names = computed(() => new Map([...people.value].map(([a, p]) => [a, p.name])))
</script>

<template>
  <section class="deals" data-testid="cabinet-deals">
    <SectionHead :title="t('deals.title')">
      <button type="button" class="deals__how" @click="ui.openSafeDealHelp()">
        {{ t('deals.how') }}
      </button>
    </SectionHead>

    <div v-if="guarantor && myGuarantor" class="deals__guarantor" data-testid="deals-guarantor">
      <span class="deals__shield"><UiIcon name="safe-deal" :size="22" /></span>
      <span class="deals__gtext">
        <strong>{{ t('deals.guarantor.title', { fee: pct(myGuarantor.feePercent) }) }}</strong>
        <span class="deals__muted">{{
          myGuarantor.available ? t('deals.guarantor.on') : t('deals.guarantor.off')
        }}</span>
      </span>
      <UiBadge :tone="myGuarantor.available ? 'success' : 'neutral'">{{
        myGuarantor.available ? t('deals.guarantor.badgeOn') : t('deals.guarantor.badgeOff')
      }}</UiBadge>
      <RouterLink :to="cabinetRoute(me, 'wallet')" class="deals__change">{{
        t('deals.guarantor.change')
      }}</RouterLink>
    </div>

    <UiEmptyState
      v-if="!list.items.value.length"
      icon="safe-deal"
      :title="t('deals.empty.title')"
      :text="t('deals.empty.text')"
      data-testid="deals-empty"
    />

    <template v-else>
      <UiTabs v-model="tab" :items="tabs" :label="t('deals.title')" data-testid="deals-tabs" />
      <div class="deals__roles" role="group">
        <UiChip
          v-for="r in ROLES"
          :key="r"
          :selected="role === r"
          :size="36"
          :data-testid="`deals-role-${r}`"
          @click="role = r"
          >{{ t(`deals.roles.${r}`) }}</UiChip
        >
      </div>

      <div v-if="shown.length" class="deals__list" data-testid="deals-list">
        <DealRow v-for="item in shown" :key="item.deal.id" :item="item" :names="names" />
      </div>
      <p v-else class="deals__none">
        {{
          role !== 'all'
            ? t('deals.empty.role')
            : tab === 'done'
              ? t('deals.empty.done')
              : t('deals.empty.title')
        }}
      </p>
    </template>

    <UiAlert tone="info">{{ t('deals.note') }}</UiAlert>
  </section>
</template>

<style scoped>
.deals {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.deals__how,
.deals__change {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
  text-decoration: none;
}

.deals__guarantor {
  padding: 14px 16px;
  border-radius: var(--radius-l);
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 14px;
}

.deals__shield {
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: var(--radius-m);
  background: var(--primary-soft);
  color: var(--primary);
  display: grid;
  place-items: center;
}

.deals__gtext {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 15px;
  line-height: 20px;
}

.deals__muted {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.deals__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.deals__list {
  border-radius: var(--radius-l);
  background: var(--surface);
  overflow: hidden;
}

.deals__none {
  padding: 24px 0;
  color: var(--text2);
  text-align: center;
}

@media (max-width: 767px) {
  .deals__guarantor {
    flex-wrap: wrap;
    gap: 10px 14px;
  }

  /* The status and «Изменить» go under the text. */
  .deals__gtext {
    flex-basis: calc(100% - 54px);
  }

  .deals__guarantor :deep(.ui-badge) {
    margin-left: 54px;
  }

  .deals__change {
    margin-left: auto;
  }

  .deals__roles {
    flex-wrap: nowrap;
    overflow-x: auto;
    margin: 0 calc(-1 * var(--page-pad, 16px));
    padding: 0 var(--page-pad, 16px);
    scrollbar-width: none;
  }
}
</style>
