import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isBanned } from '@/config/ban'
import type { DeliveryPick } from '@/models/delivery'
import { useSessionStore } from '@/stores/session'
import { dismiss as dismissToast, showToast } from '@/ui/toast'

/** Link to an offer that opens Barteron inside Bastyon (old `sdk.appLink`). */
export function offerLink(applink: (path: string) => string, hash: string): string {
  return applink(`barter/${hash}`)
}

type Translate = (key: string) => string

/**
 * «Предложить обмен»: my offer, then theirs, then the phrase — the order the
 * old app sent (components/barter/item/index.js:855, 930-931).
 */
export function exchangeMessages(
  applink: (path: string) => string,
  mine: string,
  theirs: string,
  t: Translate
): string[] {
  return [offerLink(applink, mine), offerLink(applink, theirs), t('chatMessage.exchangeProposed')]
}

/** «Купить»: the offer, then how the buyer wants to get it (index.js:852-927). */
export function purchaseMessages(
  applink: (path: string) => string,
  offer: string,
  pick: DeliveryPick | null,
  t: Translate
): string[] {
  const messages = [offerLink(applink, offer)]
  if (pick?.way === 'selfPickup') messages.push(t('chatMessage.selfPickup'))
  else if (pick?.way === 'directDelivery') messages.push(t('chatMessage.directDelivery'))
  else if (pick?.way === 'pickupPoint') {
    messages.push(offerLink(applink, pick.id), t('chatMessage.pickupPoint'))
  }
  return messages
}

export interface ChatRequest {
  /** Room name; the old app named exchange rooms after the offer. */
  name?: string
  members: string[]
  messages: string[]
}

/**
 * Opens a Bastyon chat and sends the first messages, like the old
 * `sendMessage` (main.js:339-361): `chat` permission, `getOrCreateRoom`,
 * `openRoom`, `send`.
 *
 * Not yet: the old app also asked p2p.back to notify the members in
 * Telegram/VK; that comes with notifications (PLAN.md, stage 6).
 */
export function useChat() {
  const session = useSessionStore()
  const { t } = useI18n()
  const opening = ref(false)

  async function open(request: ChatRequest): Promise<boolean> {
    const sdk = session.sdk
    if (!sdk || opening.value) return false
    if (!(await session.ensureSignedIn())) return false
    // A banned user's rooms never opened in the old app either.
    if (isBanned(session.address)) return false

    opening.value = true
    const toast = showToast(t('chat.opening'), { kind: 'progress' })
    try {
      const granted = await sdk.permissions.check({ permission: 'chat' }).catch(() => false)
      if (!granted) {
        await sdk.permissions.request(['chat'])
        if (!(await sdk.permissions.check({ permission: 'chat' }).catch(() => false))) {
          showToast(t('chat.noPermission'), { kind: 'error' })
          return false
        }
      }
      const room = (await sdk.chat.getOrCreateRoom({
        users: request.members,
        parameters: request.name ? { name: request.name } : {},
      })) as { roomid?: string } | null
      const roomid = room?.roomid
      if (!roomid) throw new Error('chat:noroom')
      await sdk.chat.openRoom(roomid)
      if (request.messages.length) {
        await sdk.chat.send({ roomid, content: { messages: request.messages, images: [] } })
      }
      return true
    } catch (error) {
      console.error('[barteron] chat failed:', error)
      showToast(t('chat.failed'), { kind: 'error' })
      return false
    } finally {
      dismissToast(toast)
      opening.value = false
    }
  }

  return { open, opening }
}
