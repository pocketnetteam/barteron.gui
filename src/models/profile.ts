/**
 * Bastyon profile from `getuserprofile`: name and avatar of a Barteron user.
 * The Barteron profile (tx 104) has neither, so every seller is shown with
 * these. Fields: bastyon-nextgen `src/types/rpc-responses/user-get.ts`.
 */

import { visibleName } from '@/lib/text'
import { str, type JsonObject } from './tx'

export interface UserProfile {
  address: string
  name: string
  /** Avatar URL; pass through `sdk.manageBastyonImageSrc` before showing. */
  image: string
  /** Bastyon language, `ru` / `en`… */
  language: string
  about: string
  /** Bastyon registration, ms; `null` when unknown. */
  regdate: number | null
  reputation: number
}

export function parseUserProfile(raw: JsonObject): UserProfile | null {
  const address = str(raw.address)
  if (!address) return null
  const regdate = typeof raw.regdate === 'number' && raw.regdate > 0 ? raw.regdate * 1000 : null
  return {
    address,
    name: visibleName(str(raw.name)),
    image: str(raw.i),
    language: str(raw.l),
    about: str(raw.a),
    regdate,
    reputation: typeof raw.reputation === 'number' ? raw.reputation : 0,
  }
}
