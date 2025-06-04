import ExchangeList from "@/components/barter/exchange/list/index.vue";

export default {
	name: "ProfileExchangeList",

	components: {
		ExchangeList
	},

	props: {
		hash: {
			type: String
		}
	},

	computed: {
		/**
		 * Show is this profile is your's
		 * 
		 * @returns {Boolean}
		 */
		isMyProfile() {
			return this.hash === this.sdk.address;
		},

		/**
		 * Barteron account
		 * 
		 * @returns {@Account}
		 */
		account() {
			return this.sdk.barteron.accounts[this.hash];
		}
	},

}