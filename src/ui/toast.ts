import { reactive, readonly } from 'vue'

export type ToastKind = 'success' | 'error' | 'info' | 'progress'

export interface ToastAction {
  label: string
  run: () => void
}

export interface Toast {
  id: number
  kind: ToastKind
  text: string
  action?: ToastAction
}

export interface ToastOptions {
  kind?: ToastKind
  action?: ToastAction
  /** ms; 0 keeps the toast until it is dismissed. Progress toasts stay by default. */
  duration?: number
}

/**
 * s8-confirm: four seconds; errors do not go away by themselves, and a toast
 * with an action stays until it is pressed (or closed).
 */
const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 4000,
  info: 4000,
  error: 0,
  progress: 0,
}

const durationOf = (kind: ToastKind, action?: ToastAction, duration?: number): number =>
  duration ?? (action ? 0 : DEFAULT_DURATION[kind])

const MAX_VISIBLE = 3

const state = reactive({ items: [] as Toast[] })
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let lastId = 0

function schedule(id: number, ms: number): void {
  clearTimeout(timers.get(id))
  timers.delete(id)
  if (ms > 0)
    timers.set(
      id,
      setTimeout(() => dismiss(id), ms)
    )
}

/** Shows a toast and returns its id (to update or dismiss it later). */
export function showToast(text: string, options: ToastOptions = {}): number {
  const id = ++lastId
  const kind = options.kind ?? 'success'
  state.items.push({ id, kind, text, action: options.action })
  // The oldest goes, but not a progress toast: its result is still to come.
  while (state.items.length > MAX_VISIBLE)
    dismiss((state.items.find((t) => t.kind !== 'progress') ?? state.items[0]!).id)
  schedule(id, durationOf(kind, options.action, options.duration))
  return id
}

/** Turns e.g. a progress toast into a result: «Публикуем…» → «Опубликовано». */
export function updateToast(id: number, text: string, options: ToastOptions = {}): void {
  const item = state.items.find((t) => t.id === id)
  if (!item) return
  item.text = text
  item.kind = options.kind ?? item.kind
  item.action = options.action
  schedule(id, durationOf(item.kind, options.action, options.duration))
}

export function dismiss(id: number): void {
  clearTimeout(timers.get(id))
  timers.delete(id)
  const index = state.items.findIndex((t) => t.id === id)
  if (index >= 0) state.items.splice(index, 1)
}

export function dismissAll(): void {
  for (const item of [...state.items]) dismiss(item.id)
}

export const toasts = readonly(state)
