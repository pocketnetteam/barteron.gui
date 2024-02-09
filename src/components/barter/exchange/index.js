export default {
	name: "BarterExchange",

	props: {
		item: Object,
		items: []
	},

	data() {
		return {
			lightbox: false,
			selected: null,
			groupExchange: []
		}
	},

	methods: {
		/**
		 * Propose excange your offer to seller's offer
		 */
		proposeExchange() {
			this.$emit("propose", this.items[this.selected]);
			this.lightbox = false;
		},

		/**
		 * Contact seller
		 */
		contactSeller() {
			this.$emit("contact", this.item);
		}
	},

	async mounted() {
		/* this.groupExchange = await this.sdk.getBrtOfferDeals({
			offer: this.item.hash,
			address: this.sdk.address
		}); */
	}
}