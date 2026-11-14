/**
 * The page under a full-screen layer does not scroll. Layers open over each
 * other (the category picker over the filters, the photo viewer) and closed
 * ones come and go with their pages, so the lock is counted: the page
 * scrolls again only when no layer holds it. Each layer gets its own handle.
 * UiDialog counts its own on `<body>`.
 */
export function pageScrollLock(): (on: boolean) => void {
  let held = false
  return (on) => {
    if (on === held) return
    held = on
    const root = document.documentElement
    const count = Math.max(0, Number(root.dataset.scrollLocks ?? 0) + (on ? 1 : -1))
    root.dataset.scrollLocks = String(count)
    root.style.overflow = count > 0 ? 'hidden' : ''
  }
}
