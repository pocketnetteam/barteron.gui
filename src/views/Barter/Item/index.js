import viewedStore from "@/stores/viewed.js";
import banProcessor from "@/js/banUtils.js";

export default {
	name: "BarterItem",

	computed: {
		offer() {
			let offer = this.sdk.barteron.offers[this.$route.params.id];

			if (banProcessor.isBannedAddress(offer?.address)) {
				offer = {};
			};

			/* Add offer to viewed list */
			if (offer?.hash) {
				viewedStore.set(offer.hash);
			}

			return offer;
		}
	}
}