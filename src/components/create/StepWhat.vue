<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOfferForm } from '@/composables/offer-form'
import { SUPPORT_EMAIL } from '@/config/roles'
import { isPointDraft, MAX_DESCRIPTION, suggestCategories } from '@/models/draft'
import { showToast } from '@/ui/toast'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiChoiceCard from '@/ui/UiChoiceCard.vue'
import UiField from '@/ui/UiField.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiInput from '@/ui/UiInput.vue'
import UiSegmented from '@/ui/UiSegmented.vue'
import UiTextarea from '@/ui/UiTextarea.vue'
import StepHead from './StepHead.vue'

const CategoryPickerDialog = defineAsyncComponent(
  () => import('@/components/catalog/CategoryPickerDialog.vue')
)

/** Step 1 (s4-step1): title, category picked by the title, condition, description. */
const { t } = useI18n()
const form = useOfferForm()
const { categories } = form
const d = computed(() => form.draft.value!)
const point = computed(() => isPointDraft(d.value))

const tree = computed(() => categories.tree.value)
const label = (id: number) => categories.label(id) ?? String(id)
/** The two levels above: enough to tell «Планшеты» of electronics from others. */
const path = (id: number) =>
  (tree.value?.parents(id) ?? [])
    .slice(-2)
    .map((p) => categories.label(p.id))
    .join(' › ')

const suggested = computed(() => {
  const value = tree.value
  const names = categories.names.value
  return value && names ? suggestCategories(d.value.caption, value, names) : []
})
/** The chosen category first, then what the title suggests. */
const choices = computed(() => {
  const list = [...suggested.value]
  const tag = d.value.tag
  if (tag !== null && tree.value?.isLeaf(tag) && !list.includes(tag)) list.unshift(tag)
  return list
})
const wide = computed(() => {
  const tag = d.value.tag
  return tag !== null && !!tree.value && !tree.value.isLeaf(tag) ? tag : null
})

const pickerOpen = ref(false)
const pickerStart = ref<number | null>(null)
function openPicker(start: number | null = null) {
  pickerStart.value = start
  pickerOpen.value = true
}
function onPick(id: number | null) {
  pickerOpen.value = false
  if (id !== null) d.value.tag = id
}

const conditions = computed(() => [
  { value: 'new' as const, label: t('create.what.new') },
  { value: 'used' as const, label: t('create.what.used') },
])

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(SUPPORT_EMAIL)
    showToast(t('create.what.emailCopied'))
  } catch {
    // Clipboard blocked in the frame: the address is on screen anyway.
  }
}
</script>

<template>
  <StepHead
    :n="form.stepIndex.value + 1"
    :total="form.steps.value.length"
    :title="t('create.what.title')"
  />

  <UiField
    v-slot="{ id, describedBy, invalid }"
    data-field="caption"
    :label="t('create.what.caption')"
    :hint="point ? t('create.what.captionHintPoint') : t('create.what.captionHint')"
    :error="form.fieldError('caption')"
  >
    <UiInput
      :id="id"
      v-model="d.caption"
      :aria-describedby="describedBy"
      :invalid="invalid"
      autocomplete="off"
      data-testid="create-caption"
    />
  </UiField>

  <div class="sw__group" data-field="category">
    <span class="sw__label">{{ t('create.what.category') }}</span>
    <span v-if="suggested.length" class="sw__sub">{{ t('create.what.suggested') }}</span>

    <div v-if="wide !== null" class="sw__wide">
      <span class="sw__wide-body">
        <span class="sw__wide-name">{{ label(wide) }}</span>
        <span class="sw__wide-path">{{ t('create.what.hasChildren') }}</span>
      </span>
      <UiButton variant="ghost" :size="36" @click="openPicker(wide)">
        {{ t('create.what.refine') }}
      </UiButton>
    </div>

    <div
      v-if="choices.length"
      class="sw__choices"
      role="radiogroup"
      :aria-label="t('create.what.category')"
    >
      <UiChoiceCard
        v-for="id in choices"
        :key="id"
        :model-value="d.tag ?? undefined"
        :value="id"
        name="category"
        :title="label(id)"
        :description="path(id)"
        :data-testid="`create-category-${id}`"
        @update:model-value="d.tag = $event ?? null"
      />
    </div>

    <button type="button" class="sw__pick" data-testid="create-pick-category" @click="openPicker()">
      <UiIcon name="tiles" :size="18" />{{ t('create.what.pick') }}
    </button>
    <p v-if="form.fieldError('category')" class="sw__error" role="alert">
      <UiIcon name="error" :size="14" :stroke="2" />{{ form.fieldError('category') }}
    </p>
  </div>

  <UiAlert v-if="point && !form.pointForbidden.value" tone="info" icon="pickup-point">
    {{ t('create.what.pointNotice') }}
  </UiAlert>
  <UiAlert
    v-if="form.pointForbidden.value"
    tone="warning"
    icon="pickup-point"
    :title="t('create.what.pointForbiddenTitle')"
    data-testid="create-point-forbidden"
  >
    {{ t('create.what.pointForbiddenText', { email: SUPPORT_EMAIL }) }}
    <template #action>
      <UiButton variant="neutral" :size="36" icon="copy" @click="copyEmail">
        {{ t('create.what.copyEmail') }}
      </UiButton>
    </template>
  </UiAlert>

  <div v-if="!point" class="sw__group">
    <span id="create-condition" class="sw__label">{{ t('create.what.condition') }}</span>
    <UiSegmented
      v-model="d.condition"
      class="sw__condition"
      :items="conditions"
      :label="t('create.what.condition')"
    />
  </div>

  <UiField
    v-slot="{ id, describedBy, invalid }"
    data-field="description"
    :label="t('create.what.description')"
    :hint="point ? t('create.what.descriptionHintPoint') : t('create.what.descriptionHint')"
    :error="form.fieldError('description')"
    :count="d.description.length"
    :max="MAX_DESCRIPTION"
  >
    <UiTextarea
      :id="id"
      v-model="d.description"
      :rows="6"
      :aria-describedby="describedBy"
      :invalid="invalid"
      :maxlength="MAX_DESCRIPTION"
      data-testid="create-description"
    />
  </UiField>

  <CategoryPickerDialog
    v-if="pickerOpen"
    v-model:open="pickerOpen"
    :title="t('create.what.pickTitle')"
    mode="leaf"
    :start="pickerStart"
    @select="onPick"
  />
</template>

<style scoped>
.sw__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sw__label {
  font-size: 14px;
  font-weight: 600;
}

.sw__sub {
  font-size: 13px;
  color: var(--text2);
}

.sw__choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sw__wide {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px 12px 16px;
  border-radius: 14px;
  border: 2px solid var(--danger);
}

.sw__wide-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sw__wide-name {
  font-size: 15px;
  font-weight: 600;
}

.sw__wide-path {
  font-size: 13px;
  color: var(--text2);
}

.sw__pick {
  align-self: flex-start;
  height: 40px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: var(--link);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border-radius: 8px;
}

.sw__pick:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.sw__error {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--danger);
}

.sw__condition {
  max-width: 320px;
}

@media (max-width: 767px) {
  .sw__condition {
    max-width: none;
  }
}
</style>
