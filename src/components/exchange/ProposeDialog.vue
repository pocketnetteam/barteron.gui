<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import type { ExchangeChain } from '@/models/exchange'
import type { Offer } from '@/models/offer'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiIcon from '@/ui/UiIcon.vue'

export interface Person {
  name: string
  avatar?: string | null
}

/**
 * Before the chat opens (s6-states): «Предложить обмен?» — my offer for
 * theirs; «Создать групповой чат?» — the other two of the chain.
 */
const props = defineProps<{
  /** A direct exchange: my offer and theirs. */
  direct?: { source: Offer; target: Offer; seller: Person } | null
  chain?: ExchangeChain | null
  people?: ReadonlyMap<string, Person>
  sending?: boolean
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()

const { t } = useI18n()
const context = useCardContext()
const photo = (offer: Offer) => offerCardData(offer, context.value).photo

const members = computed(() => {
  const c = props.chain
  if (!c) return []
  return [c.via, c.target].map((offer) => {
    const person = props.people?.get(offer.address)
    return {
      address: offer.address,
      name: person?.name || t('exchanges.someone'),
      avatar: person?.avatar ?? null,
      title: offer.caption,
    }
  })
})
const room = computed(() => t('exchanges.roomName'))
</script>

<template>
  <UiDialog
    v-model:open="open"
    :title="chain ? t('exchanges.propose.chainTitle') : t('exchanges.propose.directTitle')"
    :closable="!sending"
    :width="460"
  >
    <div v-if="direct" class="pd__pair">
      <figure class="pd__side">
        <OfferPhoto :src="photo(direct.source)" ratio="4 / 3" radius="10px" highlight />
        <figcaption>
          <span class="pd__label">{{ t('exchanges.youGive') }}</span>
          <span class="pd__title">{{ direct.source.caption }}</span>
        </figcaption>
      </figure>
      <UiIcon name="exchange" :size="24" :stroke="2" class="pd__icon" />
      <figure class="pd__side">
        <OfferPhoto :src="photo(direct.target)" ratio="4 / 3" radius="10px" />
        <figcaption>
          <span class="pd__label">{{ t('exchanges.youGet') }}</span>
          <span class="pd__title">{{ direct.target.caption }}</span>
        </figcaption>
      </figure>
    </div>
    <p v-if="direct" class="pd__note">
      <strong>{{ direct.seller.name }}</strong> · {{ t('exchanges.propose.directNote') }}
    </p>

    <ul v-if="chain" class="pd__members">
      <li v-for="m in members" :key="m.address" class="pd__member">
        <UiAvatar :size="32" :name="m.name" :src="m.avatar" :seed="m.address" />
        <span>{{ t('exchanges.propose.member', { name: m.name, title: m.title }) }}</span>
      </li>
    </ul>
    <p v-if="chain" class="pd__note">{{ t('exchanges.propose.chainNote', { room }) }}</p>

    <template #actions>
      <UiButton variant="neutral" :disabled="sending" @click="open = false">{{
        t('ui.cancel')
      }}</UiButton>
      <UiButton
        external
        :loading="sending"
        data-testid="propose-confirm"
        @click="emit('confirm')"
        >{{ chain ? t('exchanges.propose.createChat') : t('exchanges.propose.openChat') }}</UiButton
      >
    </template>
  </UiDialog>
</template>

<style scoped>
.pd__pair {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pd__side {
  flex: 1;
  min-width: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pd__side figcaption {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pd__label {
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

.pd__title {
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pd__icon {
  flex: none;
  color: var(--link);
}

.pd__note {
  margin-top: 14px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.pd__note strong {
  color: var(--text);
  font-weight: 600;
}

.pd__members {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pd__member {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  line-height: 20px;
}
</style>
