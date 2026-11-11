<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PlaceMap from '@/components/map/PlaceMap.vue'
import { useAddressSearch } from '@/composables/address-search'
import { usePlaceName } from '@/composables/place-name'
import { decodeGeohash, encodeGeohash, type LatLng } from '@/lib/geohash'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'
import { showToast } from '@/ui/toast'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiIcon from '@/ui/UiIcon.vue'

/** Picks the place new offers start from: a point on the map, an address, or «Где я». */
const props = defineProps<{ geohash: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ save: [geohash: string] }>()
const { t } = useI18n()
const session = useSessionStore()
const location = useLocationStore()

const chosen = ref('')
watch(open, (value) => {
  if (value) chosen.value = props.geohash
})
const at = computed(() => decodeGeohash(chosen.value))
const center = computed<LatLng>(() => at.value ?? location.device ?? location.mapCenter)
const placeName = usePlaceName(chosen)

const search = useAddressSearch()
const offline = computed(() => session.mode !== 'bastyon')
function setPoint(value: LatLng) {
  chosen.value = encodeGeohash(value)
}
function choose(place: { point: LatLng; label: string }) {
  setPoint(place.point)
  search.clear()
}
const locating = ref(false)
async function locate() {
  locating.value = true
  const found = await location.locate(true)
  locating.value = false
  if (found) setPoint(found)
  else showToast(t('create.place.locateFailed'))
}

function save() {
  if (!chosen.value) return
  emit('save', chosen.value)
  open.value = false
}
</script>

<template>
  <UiDialog v-model:open="open" :title="t('settings.place.dialogTitle')" :width="640">
    <div class="hp">
      <p class="hp__text">{{ t('settings.place.dialogText') }}</p>
      <div class="hp__search">
        <label class="hp__input">
          <UiIcon name="search" :size="18" />
          <span class="visually-hidden">{{ t('create.place.search') }}</span>
          <input
            v-model="search.query.value"
            type="search"
            autocomplete="off"
            :placeholder="placeName.data.value ?? t('create.place.search')"
          />
        </label>
        <UiButton variant="secondary" :size="48" icon="send" :loading="locating" @click="locate">
          {{ t('create.place.locate') }}
        </UiButton>
      </div>
      <ul v-if="search.results.value.length" class="hp__results">
        <li v-for="r in search.results.value" :key="r.label">
          <button type="button" class="hp__result" @click="choose(r)">{{ r.label }}</button>
        </li>
      </ul>
      <p
        v-else-if="search.query.value.trim().length >= 3 && !search.searching.value"
        class="hp__note"
      >
        {{ offline ? t('create.place.searchOffline') : t('create.place.noResults') }}
      </p>
      <PlaceMap
        :point="at"
        :center="center"
        :label="t('create.place.mapLabel')"
        @update:point="setPoint"
      />
      <p v-if="at" class="hp__place" data-testid="home-place-name">
        <UiIcon name="location" :size="16" />
        {{ placeName.data.value ?? t('create.place.pointOnMap') }}
      </p>
    </div>
    <template #actions>
      <UiButton variant="neutral" @click="open = false">{{ t('ui.cancel') }}</UiButton>
      <UiButton :disabled="!chosen" data-testid="home-place-save" @click="save">{{
        t('settings.place.save')
      }}</UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.hp {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hp__text,
.hp__note {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.hp__search {
  display: flex;
  gap: 8px;
}

.hp__input {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0 14px;
  border: 1.5px solid transparent;
  border-radius: 12px;
  background: var(--muted);
  color: var(--text3);
  display: flex;
  align-items: center;
  gap: 10px;
}

.hp__input:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.hp__input input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 16px;
}

.hp__results {
  list-style: none;
  margin: 0;
  padding: 6px;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-2);
}

.hp__result {
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.hp__result:hover {
  background: var(--muted);
}

.hp__result:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.hp__place {
  margin: 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text2);
}

@media (max-width: 767px) {
  .hp__search {
    flex-direction: column;
  }
}
</style>
