import viewed from "@/stores/viewed.js";
import ViewedStore from "@/stores/viewed.js";

export default {
	name: "BarterItem",

	computed: {
		offer() {
			const offer = this.sdk.barteron.offers[this.$route.params.id];

			/* Add offer to viewed list */
			if (offer?.hash) {
				ViewedStore.set(offer.hash);
			}

			return offer;
		}
	}
}