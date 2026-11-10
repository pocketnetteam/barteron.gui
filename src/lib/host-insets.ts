import type { AppInfo } from '@/sdk/types'

/** Space kept between the host's close button and our own controls. */
const CORNER_GAP = 8

/**
 * The width our headers keep free at the top right, where bastyon-nextgen puts
 * its close "petal" (`appinfo.closebutton`, HOST-TASKS.md item 2). The old host
 * does not send it, and nothing moves. (`--app-margin-top` is not ours: sdk.js
 * sets it from `appinfo.margintop` during init.)
 */
export function hostCorner(info: AppInfo | null | undefined): string {
  const button = info?.closebutton
  if (!button || button.side === 'left') return '0px'
  const width = Number(button.width)
  return Number.isFinite(width) && width > 0 ? `${width + CORNER_GAP}px` : '0px'
}

/** Puts {@link hostCorner} on `:root` as `--host-corner`. */
export function applyHostInsets(
  info: AppInfo | null | undefined,
  root = document.documentElement
): void {
  root.style.setProperty('--host-corner', hostCorner(info))
}
