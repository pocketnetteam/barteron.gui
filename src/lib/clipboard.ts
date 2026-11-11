/**
 * Copies text. Inside a host frame the Clipboard API needs `clipboard-write`
 * (bastyon-nextgen allows it; an older host may not), so the old
 * `execCommand('copy')` is the second try. `false` — the caller shows the text
 * for copying by hand.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Not allowed here: try the old way.
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const done = document.execCommand('copy')
    area.remove()
    return done
  } catch {
    return false
  }
}
