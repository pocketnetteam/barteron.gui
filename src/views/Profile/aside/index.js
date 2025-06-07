import Profile from "@/components/profile/index.vue";
import Wallet from "@/components/wallet/index.vue";
import ProfileExchangeList from "@/components/barter/exchange/profile-list/index.vue";

export default {
	name: "Aside",

	components: {
		Profile,
		Wallet,
		ProfileExchangeList
	},

	inject: ['dialog'],

	computed: {
		/**
		 * Get bastyon address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.$route.params.id || this.sdk.address;
		},

		/**
		 * Show is this profile is your's
		 * 
		 * @returns {Boolean}
		 */
		isMyProfile() {
			return this.address === this.sdk.address;
		},

		/**
		 * Barteron account
		 * 
		 * @returns {@Account}
		 */
		account() {
			return this.sdk.barteron.accounts[this.address];
		}
	},

	methods: {
		createRoom() {
			this.$components.content?.createRoom();
		},
	}
}