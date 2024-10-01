import BarterItem from "@/components/barter/item/index.vue";
import Votes from "@/components/votes/index.vue";

export default {
	name: "Content",

	components: {
		BarterItem,
		Votes
	},

	computed: {
		/**
		 * Get offer
		 * 
		 * @returns {Object|undefined}
		 */
		item() {
			return this.sdk.barteron.offers[this.$route.params.id];
		},

		/**
		 * Show is this offer is owner's
		 * 
		 * @returns {Boolean}
		 */
		isMyOffer() {
			return this.item.address === this.sdk.address;
		}
	}
}