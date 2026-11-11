import { useI18n } from 'vue-i18n'
import { SUPPORT_EMAIL } from '@/config/roles'
import { copyText } from '@/lib/clipboard'
import { useSessionStore } from '@/stores/session'
import { showToast } from '@/ui/toast'

/**
 * «Написать в поддержку»: the network's support address (old
 * `supportSettings.supportEmail`). There is no service to send a form to —
 * the old form only pretended to send — so the user writes a letter.
 */
export function useSupport() {
  const session = useSessionStore()
  const { t } = useI18n()

  async function copyEmail(): Promise<boolean> {
    const done = await copyText(SUPPORT_EMAIL)
    if (done) showToast(t('support.copied'))
    else showToast(t('support.copyFailed', { email: SUPPORT_EMAIL }), { kind: 'error' })
    return done
  }

  /**
   * A letter in the mail app. bastyon-nextgen opens only http(s) links
   * (HOST-TASKS.md, item 7), so when the host refuses, the address is copied.
   */
  async function writeEmail(): Promise<void> {
    const subject = encodeURIComponent(t('support.subject'))
    try {
      if (!session.sdk) throw new Error('sdk_not_ready')
      await session.sdk.openExternalLink(`mailto:${SUPPORT_EMAIL}?subject=${subject}`)
    } catch {
      const done = await copyText(SUPPORT_EMAIL)
      showToast(
        done
          ? t('support.mailCopied', { email: SUPPORT_EMAIL })
          : t('support.mailFailed', { email: SUPPORT_EMAIL }),
        { kind: done ? 'info' : 'error' }
      )
    }
  }

  return { email: SUPPORT_EMAIL, copyEmail, writeEmail }
}
