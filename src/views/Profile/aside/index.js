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
		 * Barteron account
		 */
		account() {
			return this.sdk.barteron.account[this.sdk.address];
		}
	},

	methods: {
		/**
		 * Store tags to account
		 * 
		 * @param {Array} tags 
		 */
		changeTags(tags) {
			this.sdk.setBrtAccount({
				address: this.sdk.address,
				tags: tags
			});
		}
	}
}