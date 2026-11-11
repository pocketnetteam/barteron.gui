<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { sectionFromHash } from '@/composables/cabinet'
import { useSessionStore } from '@/stores/session'

const CabinetPage = defineAsyncComponent(() => import('./profile/CabinetPage.vue'))
const PublicProfile = defineAsyncComponent(() => import('./profile/PublicProfile.vue'))

/**
 * `/profile/:id` — the old path. My own address opens my cabinet (its
 * section in the hash), anyone else's — their public profile.
 */
const route = useRoute()
const session = useSessionStore()

const id = computed(() => String(route.params.id ?? ''))
const own = computed(() => !!session.address && id.value === session.address)
const section = computed(() => sectionFromHash(route.hash))
const cabinetSection = computed(() => {
  const s = section.value
  return s && s !== 'public' ? s : null
})
</script>

<template>
  <CabinetPage v-if="own && section !== 'public'" :section="cabinetSection" />
  <PublicProfile v-else :key="id" :address="id" :self="own" />
</template>
