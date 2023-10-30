export default {
	name: "Wallet",

	computed: {
		/**
		 * Get account balance
		 * 
		 * @returns {Object}
		 */
		balance() {
			return this.sdk.balance;
		}
	},

	created() {
		this.sdk.getBalance();
	}
}