import BarterItem from "@/components/barter/item/index.vue";
import Votes from "@/components/votes/index.vue";
import banProcessor from "@/js/banUtils.js";

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
			let offer = this.sdk.barteron.offers[this.$route.params.id];

			if (banProcessor.isBannedAddress(offer?.address)) {
				offer = {};
			};

			return offer;
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