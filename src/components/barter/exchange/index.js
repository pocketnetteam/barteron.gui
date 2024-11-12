export default {
	name: "BarterExchange",

	props: {
		item: Object,
	},

	data() {
		return {
			lightbox: false,
			selected: null,
			items: [],
			groupExchange: []
		}
	},

	computed: {
		/**
		 * Get author address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.item?.address;
		},
	},

	methods: {
		/**
		 * Create room and send message
		 * 
		 * @param {@Offer} offer
		 */
		createRoom(offer) {
			this.sendMessage({
				name: offer.caption,
				members: [this.address],
				messages: [this.sdk.appLink(`barter/${ offer.hash }`)],
				openRoom: true
			});
		},

		/**
		 * Propose excange your offer to seller's offer
		 */
		proposeExchange() {
			this.createRoom(this.items[this.selected]);
			this.lightbox = false;
		},

		/**
		 * Contact seller
		 */
		contactSeller() {
			this.createRoom(this.item);
		}
	},

	async mounted() {
		/* this.groupExchange = await this.sdk.getBrtOfferDeals({
			offer: this.item.hash,
			address: this.sdk.address
		}); */

		this.items = await this.sdk.getBrtOffers();
	}
}