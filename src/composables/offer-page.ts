import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAccount, useCategories, useUserProfile } from '@/api/queries'
import { gallerySlides, useOfferVideo } from '@/components/item/gallery'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import { categoryRoute } from '@/composables/catalog-nav'
import { formatDate, formatMonthYear, shortHash } from '@/lib/format'
import { fixedCurrencyPrice, type Offer } from '@/models/offer'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionStore } from '@/stores/session'
import { showToast } from '@/ui/toast'
import type { Crumb } from '@/ui/UiBreadcrumbs.vue'

/** What every kind of offer page shows: card data, crumbs, gallery, seller, share. */
export function useOfferPage(offer: Ref<Offer>) {
  const { t, locale } = useI18n()
  const session = useSessionStore()
  const favorites = useFavoritesStore()
  const categories = useCategories()
  const ctx = useCardContext()
  const seller = useAccount(() => offer.value.address)
  const profile = useUserProfile(() => offer.value.address)
  const video = useOfferVideo(() => offer.value.video || null)

  const id = computed(() => offer.value.hash ?? '')
  const card = computed(() =>
    offerCardData(offer.value, {
      ...ctx.value,
      sellerList: seller.data.value?.tags,
      favorite: favorites.has(id.value),
    })
  )

  const imageSrc = (url: string) => session.sdk?.manageBastyonImageSrc(url) ?? url
  const slides = computed(() =>
    gallerySlides(
      offer.value.images.map(imageSrc),
      video.slide.value,
      offer.value.videoSettings.order
    )
  )

  const categoryName = computed(() => categories.label(offer.value.tag) ?? '')
  const crumbs = computed<Crumb[]>(() => {
    const items: Crumb[] = [{ label: t('catalog.home'), to: { name: 'home' } }]
    const tag = offer.value.tag
    const tree = categories.tree.value
    if (tag !== null && tree) {
      for (const p of tree.parents(tag)) {
        items.push({ label: categories.label(p.id) ?? '', to: categoryRoute(p.id) })
      }
      items.push({ label: categoryName.value, to: categoryRoute(tag) })
    }
    return items
  })

  const published = computed(() => formatDate(offer.value.time, locale.value))
  const till = computed(() => formatDate(offer.value.till, locale.value))
  const number = computed(() => shortHash(id.value))

  const sellerName = computed(
    () => profile.data.value?.name || shortHash(offer.value.address, 4, 4)
  )
  const sellerAvatar = computed(() => {
    const image = profile.data.value?.image
    return image ? imageSrc(image) : null
  })
  const sellerSince = computed(() => {
    const regdate = seller.data.value?.regdate ?? profile.data.value?.regdate
    return regdate
      ? t('item.seller.since', { date: formatMonthYear(regdate, locale.value) })
      : undefined
  })

  /** «О товаре»: condition, category, how the price is set. */
  const facts = computed(() => {
    const fixed = fixedCurrencyPrice(offer.value)
    return [
      {
        label: t('item.about.condition'),
        value: t(`offer.condition.${card.value.condition ?? 'new'}`),
      },
      { label: t('item.about.category'), value: categoryName.value || '—' },
      {
        label: t('item.about.price'),
        value: card.value.price.free
          ? t('price.free')
          : fixed
            ? t('item.about.priceFixed', { currency: fixed.currency })
            : t('item.about.pricePkoin'),
      },
    ]
  })

  /** «Поделиться в Bastyon»: a post with the offer link (old `sdk.share`). */
  async function share() {
    const sdk = session.sdk
    if (!sdk || !id.value) return
    const data = {
      path: `barter/${id.value}`,
      sharing: {
        title: '',
        text: { body: offer.value.caption },
        images: offer.value.images.map(imageSrc),
      },
    }
    try {
      if (sdk.helpers.shareOnBastyon) sdk.helpers.shareOnBastyon(data)
      else await sdk.helpers.share(data)
    } catch {
      showToast(t('item.shareFailed'), { kind: 'error' })
    }
  }

  /** The host's complaint form with its own reasons (old components/barter/item/complain). */
  async function complain() {
    const sdk = session.sdk
    if (!sdk || !id.value) return
    let search = ''
    try {
      search = new URL(sdk.get.applink(`barter/${id.value}`)).search
    } catch {
      // A relative link: no query to pass.
    }
    await sdk.helpers
      .complain({ entityLink: `/application${search}`, entityTxid: id.value, entityType: 'offer' })
      .catch(() => null)
  }

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(id.value)
      showToast(t('item.numberCopied'))
    } catch {
      showToast(id.value, { kind: 'info' })
    }
  }

  return {
    id,
    card,
    slides,
    retryVideo: video.retry,
    crumbs,
    categoryName,
    published,
    till,
    number,
    seller,
    profile,
    sellerName,
    sellerAvatar,
    sellerSince,
    facts,
    share,
    complain,
    copyNumber,
    canComplain: computed(() => !!session.sdk?.helpers.complain),
  }
}
