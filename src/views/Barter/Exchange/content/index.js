import Vue from "vue";
import BarterList from "@/components/barter/list/index.vue";

export default {
	name: "Content",

	components: {
		BarterList
	},

	data() {
		return {
			deals: []
		}
	},

	inject: ["dialog"],

	computed: {
		/**
		 * Get offer by id
		 * 
		 * @returns {@Offer}
		 */
		offer() {
			return this.sdk.barteron.offers[this.$route.params.id];
		},

		/**
		 * Get expanded state
		 * 
		 * @returns {Boolean}
		 */
		expanded() {
			return !!this.$route.query.expanded;
		}
	},

	methods: {
		/**
		 * Show exchange options
		 */
		expand() {
			this.$router.replace({ query: { expanded: 1 } }).catch(e => {
				this.showError(e);
			});
		},

		/**
		 * Create room and send message
		 * 
		 * @param {@Offer} offer
		 */
		createRoom(offer) {
			this.sendMessage({
				name: this.offer.caption,
				members: [offer.address],
				messages: [this.sdk.appLink(`barter/${ this.offer.hash }`)],
				openRoom: true
			});
		},
	},

	async beforeRouteEnter (to, from, next) {
		const
			hash = to.params?.id,
			sdk = Vue.prototype.sdk;
		
		let
			deals = [],
			offer = sdk.barteron.offers[hash];
		
		const isLoaded = (offer) => (offer && offer?.tag);

		if (!(isLoaded(offer))) {
			try {
				offer = await sdk.getBrtOffersByHashes([hash]).then(result => result?.pop());
			} catch (e) {
				console.error(e);
			}
		}

		if (isLoaded(offer)) {
			try {
				deals = await sdk.getBrtOfferDeals({
					myTags: [offer?.tag],
					theirTags: await sdk.getTheirTags(offer),
					excludeAddresses: [offer?.address]
				});				
			} catch (e) {
				console.error(e);
			}
		}

		/* Pass data to instance */
		next(vm => vm.deals = deals);
	}
}