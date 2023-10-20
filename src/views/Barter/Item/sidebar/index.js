import BarterExchange from "@/components/barter/exchange/index.vue";
import Profile from "@/components/profile/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";

export default {
	name: "Sidebar",

	components: {
		BarterExchange,
		Profile,
		ExchangeList
	},

	data() {
		return {
			myOffers: []
		}
	},

	computed: {
		/**
		 * Get offer data
		 * 
		 * @return {Object}
		 */
		item() {
			return (Number.isInteger(this.$route.params.id) ? this.barters.items : this.sdk.barteron.offers)[this.$route.params.id];
		},

		/**
		 * Show is this offer is owner's
		 * 
		 * @return {Boolean}
		 */
		isMyOffer() {
			return this.address === this.sdk.address;
		},

		/**
		 * Get author address
		 * 
		 * @return {String}
		 */
		address() {
			return this.item.address;
		},
		
		/**
		 * Get author account
		 * 
		 * @return {Object}
		 */
		account() {
			return this.sdk.barteron.accounts[this.address];
		}
	},

	async mounted() {
		this.myOffers = await this.sdk.getBrtOffers();
	}
}