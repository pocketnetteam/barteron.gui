// Copied as is from the old app. Main-net addresses start with P and test-net
// ones with T, so one list serves both networks.

/** Safe deal guarantors: barteron.gui src/js/safeDealSettings.js, `validatorAddresses`. */
export const GUARANTORS: readonly string[] = [
  'PMdhZ1gvZXAXmQ6z5ghHz86arfXorxNYgX',
  'PPbNqCweFnTePQyXWR21B9jXWCiDJa2yYu',
  'PMkhdDuCM3k8xLRDBUnmBDcUMWjhfPbWbE',
  'TVABvVQKn6MaqXziDaUjW5afg9EcGdGQuX',
  'THC9eiAxFEA9TFv8jLCsoDuLNsa2gCmw6V',
  'TJmXy5Q4jgR6QzB7qmncFoURmVMBB95aL6',
  'TWEE5wJDL2EjR6iryH5mTyebDZWRbPZ733',
]

/** Guarantor fee when the profile does not set one, percent. */
export const DEFAULT_GUARANTOR_FEE_PERCENT = 5

/** Rating moderators: barteron.gui src/js/supportSettings.js, `moderatorAddresses`. */
export const MODERATORS: readonly string[] = [
  'PMdhZ1gvZXAXmQ6z5ghHz86arfXorxNYgX',
  'PXYhCbTwPaUHrP6spJM5NY84TBpLQJtZi5',
  'TVABvVQKn6MaqXziDaUjW5afg9EcGdGQuX',
  'THC9eiAxFEA9TFv8jLCsoDuLNsa2gCmw6V',
  'TJmXy5Q4jgR6QzB7qmncFoURmVMBB95aL6',
  'TWEE5wJDL2EjR6iryH5mTyebDZWRbPZ733',
]

/** Referral programme terms (old `sdk.referralProgramInfoURL`). */
export const REFERRAL_TERMS_URL = 'https://barteron.bastyon.com/#prom-part'

/** Link a referral shares: Barteron in Bastyon with the inviter (old referral dialog). */
export const referralLink = (address: string): string =>
  `https://bastyon.com/application?id=barteron.pocketnet.app&ref=${address}`

/** Where to get the Bastyon apps (old `appsLink`). */
export const BASTYON_APPS_URL = 'https://bastyon.com/applications'

export const SUPPORT_EMAIL = 'support@bastyon.com'

/**
 * Dev and test builds: the SDK mock user (`PMockUser…`) and the demo seller
 * Илья (`PDemoIyaPetrov…`) hold both roles, so the cabinet and the public
 * profile can show them. These made-up addresses never occur on a real network.
 */
const DEMO_ROLES = /^P(MockUser|DemoIyaPetrov)/
const demoRole = (address: string) =>
  import.meta.env.VITE_SHOWCASE === 'true' && DEMO_ROLES.test(address)

/** Can hold payment in safe deals; their fee and availability live in the Barteron profile. */
export function isGuarantor(address: string | null | undefined): boolean {
  return !!address && (GUARANTORS.includes(address) || demoRole(address))
}

/** Reviews requests for low scores (stage 8). */
export function isModerator(address: string | null | undefined): boolean {
  return !!address && (MODERATORS.includes(address) || demoRole(address))
}

/** The demo moderator on duty in dev builds (sdk/mock-data.ts, `SELLERS.ilya`). */
const DEMO_MODERATOR = 'PDemoIyaPetrov'.padEnd(34, '1')

/** Addresses of the other moderators, for «is anyone else on duty». */
export const otherModerators = (address: string): string[] =>
  [...MODERATORS, ...(import.meta.env.VITE_SHOWCASE === 'true' ? [DEMO_MODERATOR] : [])].filter(
    (m) => m !== address
  )
