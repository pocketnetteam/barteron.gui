import viewedStore from "@/stores/viewed.js";

export default {
	name: "BarterItem",

	computed: {
		offer() {
			const offer = this.sdk.barteron.offers[this.$route.params.id];

			/* Add offer to viewed list */
			if (offer?.hash) {
				viewedStore.set(offer.hash);
			}

			return offer;
		}
	}
}