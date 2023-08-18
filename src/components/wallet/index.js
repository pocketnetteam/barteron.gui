export default {
	name: "Wallet",

	computed: {
		/**
		 * Get account balance
		 * 
		 * @return {Object}
		 */
		balance() {
			return this.sdk.balance;
		}
	},

	created() {
		this.sdk.getBalance();
	}
}