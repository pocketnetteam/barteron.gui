import { computed, inject, type ComputedRef, type InjectionKey } from 'vue'

/** What UiField tells the control inside it. */
export interface FieldContext {
  id: string
  describedBy: string | undefined
  invalid: boolean
  disabled: boolean
}

export const FIELD_KEY: InjectionKey<ComputedRef<FieldContext>> = Symbol('ui-field')

/** Control props win over the surrounding UiField. */
export function useFieldControl(props: {
  id?: string
  invalid?: boolean
  disabled?: boolean
}): ComputedRef<Omit<FieldContext, 'id'> & { id: string | undefined }> {
  const field = inject(FIELD_KEY, null)
  return computed(() => ({
    id: props.id ?? field?.value.id,
    describedBy: field?.value.describedBy,
    invalid: props.invalid || field?.value.invalid || false,
    disabled: props.disabled || field?.value.disabled || false,
  }))
}
