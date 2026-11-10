<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CreateForm from './create/CreateForm.vue'

/**
 * `/barter/create/:id?` and `/barter/edit/:id`. A form per offer: going from
 * one offer's form to another's (or to a new one) starts a fresh form.
 */
const route = useRoute()
const id = computed(() => {
  const value = route.params.id
  return typeof value === 'string' && value ? value : null
})
</script>

<template>
  <CreateForm :id="id" :key="id ?? 'new'" />
</template>
