<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import { chainSteps, type ExchangeChain } from '@/models/exchange'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import { chainRoute } from './exchange-ui'

/**
 * A chain of three on «Варианты обмена» (s6-offer): who gives what around
 * the circle, and the way to the chain page.
 */
const props = defineProps<{
  chain: ExchangeChain
  /** Bastyon names by address. */
  names: ReadonlyMap<string, string>
  /** The viewer owns the source offer: «Вы отдаёте», «… отдаёт вам». */
  mine?: boolean
}>()
const { t } = useI18n()
const context = useCardContext()

const name = (address: string) => props.names.get(address) || t('exchanges.someone')
const steps = computed(() =>
  chainSteps(props.chain).map((s) => ({
    ...s,
    photo: offerCardData(s.offer, context.value).photo,
    label:
      props.mine && s.role === 'source'
        ? t('exchanges.youGive')
        : props.mine && s.role === 'target'
          ? t('exchanges.givesYou', { name: name(s.giver) })
          : t('exchanges.gives', { name: name(s.giver) }),
  }))
)
const line = computed(() =>
  props.mine
    ? t('exchanges.offer.chainLine', {
        first: name(props.chain.via.address),
        a: props.chain.source.caption,
        second: name(props.chain.target.address),
        b: props.chain.via.caption,
        c: props.chain.target.caption,
      })
    : null
)
const to = computed(() => chainRoute(props.chain))
</script>

<template>
  <article class="cc" data-testid="chain-card" :data-target="chain.target.hash">
    <ol class="cc__flow">
      <template v-for="(s, i) in steps" :key="s.role">
        <li class="cc__step">
          <OfferPhoto
            class="cc__photo"
            :src="s.photo"
            ratio="4 / 3"
            radius="12px"
            :highlight="mine && s.role === 'source'"
          />
          <span class="cc__label">{{ s.label }}</span>
          <span class="cc__item">{{ s.offer.caption }}</span>
        </li>
        <li v-if="i < steps.length - 1" class="cc__arrow" aria-hidden="true">
          <UiIcon name="arrow-right" :size="28" :stroke="2" />
        </li>
      </template>
    </ol>
    <div class="cc__side">
      <p v-if="line" class="cc__line">{{ line }}</p>
      <UiButton variant="contrast" :size="44" block :to="to" data-testid="chain-open">{{
        t('exchanges.offer.showChain')
      }}</UiButton>
    </div>
  </article>
</template>

<style scoped>
.cc {
  padding: 20px;
  border-radius: 20px;
  background: var(--surface);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.cc__flow {
  flex: 999 1 520px;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr) 28px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
}

.cc__step {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cc__label {
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
}

.cc__item {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc__arrow {
  color: var(--link);
  display: flex;
}

.cc__side {
  flex: 1 1 240px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cc__line {
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

@media (max-width: 767px) {
  .cc {
    padding: 14px;
    border-radius: 16px;
    gap: 12px;
  }

  .cc__flow {
    flex-basis: 100%;
    grid-template-columns: minmax(0, 1fr) 16px minmax(0, 1fr) 16px minmax(0, 1fr);
  }

  .cc__arrow :deep(svg) {
    width: 16px;
    height: 16px;
  }

  .cc__label {
    font-size: 12px;
    line-height: 16px;
  }

  .cc__item {
    display: none;
  }

  .cc__side {
    flex-basis: 100%;
  }
}
</style>
