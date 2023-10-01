import Profile from "@/components/profile/index.vue";
import Wallet from "@/components/wallet/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";

export default {
	name: "Aside",

	components: {
		Profile,
		Wallet,
		ExchangeList
	},

	computed: {
		/**
		 * Get bastyon address
		 * 
		 * @return {String}
		 */
		address() {
			return this.sdk.address;
		},

		/**
		 * Barteron account
		 * 
		 * @return {Object}
		 */
		account() {
			return this.sdk.barteron.accounts[this.address];
		}
	},

	methods: {
		/**
		 * Store tags to account
		 * 
		 * @param {Array} tags 
		 */
		changeTags(tags) {
			this.account.update({ tags });
		}
	}
}