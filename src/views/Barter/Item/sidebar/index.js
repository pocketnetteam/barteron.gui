import BarterExchange from "@/components/barter/exchange/index.vue";
import Profile from "@/components/profile/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";
import Caption from "@/components/barter/item/caption/index.vue";
import Price from "@/components/barter/item/price/index.vue";
import MyOptions from "@/components/barter/item/my-options/index.vue";

export default {
	name: "Sidebar",

	components: {
		BarterExchange,
		Profile,
		ExchangeList,
		Caption,
		Price,
		MyOptions
	},

	inject: ["dialog"],

	computed: {
		/**
		 * Get offer data
		 * 
		 * @returns {@Offer}
		 */
		item() {
			return (Number.isInteger(this.$route.params.id) ? this.barters.items : this.sdk.barteron.offers)[this.$route.params.id];
		},

		/**
		 * Get author address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.item?.address;
		},

		/**
		 * Show is this offer is owner's
		 * 
		 * @returns {Boolean}
		 */
		isMyOffer() {
			return this.address === this.sdk.address;
		},

		/**
		 * Get author account
		 * 
		 * @returns {@Account}
		 */
		account() {
			return this.sdk.barteron.accounts[this.address];
		}
	},
}