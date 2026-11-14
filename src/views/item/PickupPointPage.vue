<script setup lang="ts">
import { computed, defineAsyncComponent, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import ItemBuyBox from '@/components/item/ItemBuyBox.vue'
import ItemGallery from '@/components/item/ItemGallery.vue'
import ItemReviews from '@/components/item/ItemReviews.vue'
import ItemSection from '@/components/item/ItemSection.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PointsMap from '@/components/map/PointsMap.vue'
import UiAvatar from '@/ui/UiAvatar.vue'
import { offerLink, useChat } from '@/composables/chat'
import { useOfferPage } from '@/composables/offer-page'
import { useOfferReviews } from '@/composables/offer-reviews'
import { formatDistance } from '@/lib/area'
import { decodeGeohash, distanceKm } from '@/lib/geohash'
import { formatHours, openState, pickupPointInfo, PICKUP_STORAGE_DAYS } from '@/models/delivery'
import { offerLifecycle, type Offer } from '@/models/offer'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'
import UiBadge from '@/ui/UiBadge.vue'
import UiBreadcrumbs from '@/ui/UiBreadcrumbs.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

const PhotoViewer = defineAsyncComponent(() => import('@/components/item/PhotoViewer.vue'))

/**
 * A pickup point — an offer of category 97 (s3-pickup-desktop): terms,
 * storage, opening hours, address and the way there, chat with its owner.
 * Buyers pick it on an offer page; nothing is bought here.
 */
const props = defineProps<{ offer: Offer }>()
const { t, locale } = useI18n()
const session = useSessionStore()
const location = useLocationStore()
const chat = useChat()

const offer = toRef(props, 'offer')
const page = useOfferPage(offer)
const reviews = useOfferReviews(offer)
const info = computed(() => pickupPointInfo(offer.value))
const point = computed(() => decodeGeohash(offer.value.geohash))
const own = computed(() => !!session.address && offer.value.address === session.address)
const inactive = computed(() => offerLifecycle(offer.value) !== 'active')

/** «от 60 PKOIN»: a pickup point's price is always «from» (old `pickupPoint || prefix`). */
const price = computed(() => ({ ...page.card.value.price, from: !page.card.value.price.free }))

const open = computed(() => openState(info.value.schedule, new Date(), point.value))
const openText = computed(() => {
  const s = open.value
  if (s.kind === 'always') return t('item.delivery.allDay')
  if (s.kind === 'open') return t('item.pickup.openNow', { time: s.until })
  if (s.kind === 'closed' && s.opens) {
    return s.opens.today
      ? t('item.delivery.opensAt', { time: s.opens.time })
      : t('item.pickup.opensOn', { day: dayNames.value[s.opens.day], time: s.opens.time })
  }
  return null
})

const dayNames = computed(() => {
  const monday = new Date(Date.UTC(2025, 0, 6))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    const name = new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(d)
    return name.charAt(0).toUpperCase() + name.slice(1)
  })
})
const today = (new Date().getDay() + 6) % 7
const days = computed(() =>
  info.value.schedule.days.map((d, i) => ({
    name: dayNames.value[i],
    hours: !d
      ? t('item.pickup.dayOff')
      : 'allDay' in d
        ? t('item.pickup.roundTheClock')
        : formatHours(d),
    today: i === today,
    off: !d,
  }))
)

const distance = computed(() => {
  const from = location.device ?? location.area?.center ?? null
  if (!from || !point.value) return null
  return formatDistance(distanceKm(from, point.value), locale.value, {
    km: t('location.km'),
    m: t('location.m'),
  })
})

function ask() {
  const sdk = session.sdk
  if (!sdk) return
  void chat.open({
    members: [offer.value.address],
    messages: [offerLink((p) => sdk.get.applink(p), page.id.value)],
  })
}

const viewerOpen = ref(false)
const viewerIndex = ref(0)
</script>

<template>
  <AppLayout :scope="offer.tag">
    <div class="pp container" data-testid="item-page" data-kind="pickup">
      <div class="pp__head">
        <UiBreadcrumbs :items="page.crumbs.value" />
        <div class="pp__title-row">
          <span class="pp__icon"><UiIcon name="pickup-point" :size="24" /></span>
          <h1 class="pp__title" data-testid="item-title">{{ offer.caption }}</h1>
          <UiBadge tone="info">{{ t('item.pickup.badge') }}</UiBadge>
        </div>
        <p class="pp__meta">
          <template v-if="reviews.average.value.count">
            <UiIcon name="star-filled" :size="14" class="pp__star" />
            <strong>{{ reviews.average.value.value.toFixed(1).replace('.', ',') }}</strong>
            ·
            {{
              t(
                'item.reviews.scores',
                { n: reviews.average.value.count },
                reviews.average.value.count
              )
            }}
          </template>
          <template v-if="openText">
            <template v-if="reviews.average.value.count"> · </template>{{ openText }}
          </template>
        </p>
      </div>

      <div class="pp__grid">
        <div class="pp__main">
          <div class="pp__gallery">
            <ItemGallery
              variant="pickup"
              :slides="page.slides.value"
              :title="offer.caption"
              :inactive="inactive"
              @open="(i) => ((viewerIndex = i), (viewerOpen = true))"
            />
          </div>

          <ItemSection>
            <div class="pp__two">
              <div>
                <h2 class="pp__h">{{ t('item.pickup.terms') }}</h2>
                <p class="pp__text">{{ info.financialTerms || t('item.pickup.termsNone') }}</p>
              </div>
              <div>
                <h2 class="pp__h">{{ t('item.pickup.storage') }}</h2>
                <p class="pp__text">
                  {{ t('item.pickup.storageText', { n: PICKUP_STORAGE_DAYS }) }}
                </p>
              </div>
            </div>
          </ItemSection>

          <ItemSection :title="t('item.pickup.schedule')" heading-id="pp-schedule">
            <template #end>
              <span v-if="open.kind === 'open' || open.kind === 'always'" class="pp__open">
                <span class="pp__dot" aria-hidden="true" />{{ t('item.pickup.openShort') }}
              </span>
            </template>
            <ol class="pp__days">
              <li
                v-for="d in days"
                :key="d.name"
                class="pp__day"
                :class="{ 'pp__day--today': d.today, 'pp__day--off': d.off }"
                :aria-current="d.today ? 'date' : undefined"
              >
                <strong>{{ d.name }}</strong>
                <span>{{ d.hours }}</span>
              </li>
            </ol>
            <p v-if="info.schedule.info" class="pp__text pp__text--muted">
              {{ info.schedule.info }}
            </p>
          </ItemSection>

          <ItemSection>
            <div class="pp__address">
              <div>
                <h2 class="pp__h">{{ t('item.pickup.address') }}</h2>
                <p class="pp__text">{{ info.address || t('item.location.unknown') }}</p>
                <template v-if="info.route">
                  <h2 class="pp__h pp__h--gap">{{ t('item.pickup.route') }}</h2>
                  <p class="pp__text">{{ info.route }}</p>
                </template>
              </div>
              <PointsMap
                v-if="point"
                :points="[{ id: 'point', at: point }]"
                :height="240"
                :label="t('item.pickup.mapLabel')"
              />
            </div>
          </ItemSection>

          <ItemSection
            v-if="offer.description"
            :title="t('item.about.description')"
            heading-id="pp-desc"
          >
            <p class="pp__text pp__desc">{{ offer.description }}</p>
          </ItemSection>

          <ItemReviews
            :average="reviews.average.value"
            :rows="reviews.rows.value"
            :form="inactive ? 'none' : reviews.form.value"
            :offer="offer"
            :own="own"
            :low-score-blocked="reviews.lowScoreBlocked.value"
            :sending="reviews.sending.value"
            @submit="reviews.submit"
          />
        </div>

        <aside class="pp__aside">
          <div class="pp__box">
            <p class="pp__label">{{ t('item.pickup.cost') }}</p>
            <ItemBuyBox
              class="pp__buy"
              :price="price"
              :inactive="inactive"
              :preview="own"
              pickup-point
              :busy="chat.opening.value"
              @ask="ask"
            />
            <ul class="pp__facts">
              <li>
                <UiIcon name="clock" :size="18" />{{
                  t('item.pickup.storageShort', { n: PICKUP_STORAGE_DAYS })
                }}
              </li>
              <li v-if="distance">
                <UiIcon name="location" :size="18" />{{
                  t('item.location.fromYou', { d: distance })
                }}
              </li>
            </ul>
            <p class="pp__hint">
              <UiIcon name="info" :size="16" />
              <span>{{ t('item.pickup.hint') }}</span>
            </p>
          </div>
          <div class="pp__owner">
            <UiAvatar
              :name="page.sellerName.value"
              :seed="offer.address"
              :src="page.sellerAvatar.value"
              :size="48"
            />
            <div>
              <p class="pp__label">{{ t('item.pickup.owner') }}</p>
              <RouterLink
                :to="{ name: 'profile', params: { id: offer.address } }"
                class="pp__owner-name"
              >
                {{ page.sellerName.value }}
              </RouterLink>
              <p v-if="page.sellerSince.value" class="pp__label">{{ page.sellerSince.value }}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <template #phone-bar>
      <div class="pp__bar">
        <UiButton :size="48" block external :disabled="own || chat.opening.value" @click="ask">
          {{ t('item.buy.askPoint') }}
        </UiButton>
      </div>
    </template>
  </AppLayout>

  <PhotoViewer
    v-if="viewerOpen"
    v-model:open="viewerOpen"
    v-model:index="viewerIndex"
    :slides="page.slides.value"
    :title="offer.caption"
    @retry-video="page.retryVideo()"
  />
</template>

<style scoped>
.pp {
  padding-top: 20px;
  padding-bottom: 48px;
}

.pp__head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.pp__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.pp__icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-m);
  background: var(--info-soft);
  color: var(--info);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pp__title {
  font-size: 32px;
  line-height: 38px;
  font-weight: 800;
  letter-spacing: -0.4px;
}

.pp__meta {
  color: var(--text2);
  font-size: 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.pp__star {
  color: var(--star);
}

.pp__meta strong {
  color: var(--text);
}

.pp__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.pp__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pp__gallery {
  padding: 16px;
  border-radius: var(--radius-xl);
  background: var(--surface);
}

.pp__two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.pp__h {
  margin-bottom: 8px;
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.pp__h--gap {
  margin-top: 16px;
}

.pp__text {
  color: var(--text2);
  font-size: 15px;
  line-height: 22px;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.pp__text--muted {
  color: var(--text3);
  font-size: 13px;
}

.pp__desc {
  color: var(--text);
}

.pp__open {
  color: var(--success);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pp__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--success);
}

.pp__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.pp__day {
  padding: 12px 4px;
  border-radius: var(--radius-m);
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text2);
  text-align: center;
}

.pp__day strong {
  color: var(--text);
}

.pp__day--today {
  background: var(--primary-soft);
}

.pp__day--today,
.pp__day--today strong {
  color: var(--link);
}

.pp__day--off {
  color: var(--text3);
}

.pp__address {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 24px;
}

.pp__aside {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pp__box {
  padding: 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pp__buy {
  padding: 0;
}

.pp__label {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.pp__facts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.pp__facts li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pp__facts .ui-icon {
  color: var(--text2);
}

.pp__hint {
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--subtle);
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
  display: flex;
  gap: 8px;
}

.pp__hint .ui-icon {
  flex: none;
  margin-top: 1px;
}

.pp__owner {
  padding: 20px 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 14px;
}

.pp__owner-name {
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
}

.pp__bar {
  display: none;
}

@media (max-width: 1099px) {
  .pp__grid {
    grid-template-columns: minmax(0, 1fr) 300px;
  }

  .pp__days {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .pp {
    padding: 12px 12px 24px;
  }

  .pp__title {
    font-size: 24px;
    line-height: 30px;
  }

  .pp__grid,
  .pp__two,
  .pp__address {
    grid-template-columns: 1fr;
  }

  .pp__main {
    gap: 12px;
  }

  .pp__gallery {
    padding: 0;
    background: none;
  }

  .pp__aside {
    position: static;
  }

  .pp__box .pp__buy :deep(.ui-button) {
    display: none;
  }

  .pp__bar {
    display: block;
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--border);
    background: var(--surface);
  }
}
</style>
