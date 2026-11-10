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

export const SUPPORT_EMAIL = 'support@bastyon.com'
