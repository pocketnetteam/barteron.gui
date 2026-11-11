import { useSessionStore } from '@/stores/session'
import { useSoon } from './catalog-nav'

/** The old app's legal documents, same paths (`/docs/ru-RU/…`); Russian only, as before. */
export const LEGAL_DOCS = [
  { key: 'agreement', file: 'UserAgreement.pdf' },
  { key: 'privacy', file: 'PersonalDataProcessingPolicy.pdf' },
  { key: 'contract', file: 'BarterAgreementDraft.docx' },
] as const

/** Opens a document from where the app is served (barteron.club inside Bastyon). */
export function useOpenDoc() {
  const session = useSessionStore()
  const soon = useSoon()
  return (file: string) => {
    const scope = session.appinfo?.application?.scope
    const origin = scope
      ? scope.startsWith('http')
        ? scope
        : `https://${scope}`
      : window.location.origin
    void session.sdk?.openExternalLink(`${origin}/docs/ru-RU/${file}`).catch(() => soon())
  }
}
