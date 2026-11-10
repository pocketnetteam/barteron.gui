import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatRadius } from '@/lib/area'
import { useLocationStore } from '@/stores/location'

/** «Москва · 10 км», or «Все регионы» when there is no place filter. */
export function useLocationLabel(separator = ' · ') {
  const { t, locale } = useI18n()
  const location = useLocationStore()
  return computed(() => {
    const area = location.area
    if (!location.filtered || !area) return t('location.allRegions')
    const radius = formatRadius(area.radiusKm, locale.value, {
      km: t('location.km'),
      m: t('location.m'),
    })
    return `${location.placeName ?? t('location.chosenPlace')}${separator}${radius}`
  })
}

/** «Москва и 10 км вокруг» for the list headers. */
export function useAreaPhrase() {
  const { t, locale } = useI18n()
  const location = useLocationStore()
  return computed(() => {
    const area = location.area
    if (!location.filtered || !area) return null
    const radius = formatRadius(area.radiusKm, locale.value, {
      km: t('location.km'),
      m: t('location.m'),
    })
    return t('location.around', { place: location.placeName ?? t('location.chosenPlace'), radius })
  })
}
