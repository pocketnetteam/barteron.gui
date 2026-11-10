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

const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 4000,
  info: 4000,
  error: 8000,
  progress: 0,
}

const MAX_VISIBLE = 3

const state = reactive({ items: [] as Toast[] })
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let lastId = 0

function schedule(id: number, kind: ToastKind, duration?: number): void {
  clearTimeout(timers.get(id))
  timers.delete(id)
  const ms = duration ?? DEFAULT_DURATION[kind]
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
  while (state.items.length > MAX_VISIBLE) dismiss(state.items[0]!.id)
  schedule(id, kind, options.duration)
  return id
}

/** Turns e.g. a progress toast into a result: «Публикуем…» → «Опубликовано». */
export function updateToast(id: number, text: string, options: ToastOptions = {}): void {
  const item = state.items.find((t) => t.id === id)
  if (!item) return
  item.text = text
  item.kind = options.kind ?? item.kind
  item.action = options.action
  schedule(id, item.kind, options.duration)
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
