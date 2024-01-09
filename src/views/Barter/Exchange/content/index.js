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
			this.$router.replace({ query: { expanded: 1 } }).catch(() => {});
		},

		/**
		 * Create room and send message
		 * 
		 * @param {@Offer} offer
		 */
		createRoom(offer) {
			this.sdk.createRoom({
				name: this.offer.caption,
				members: [offer.address]
			}).then(chat => {
				this.sdk.sendMessage({
					...chat,
					message: `https://${ this.manifest.scope }/barter/${ this.offer.hash }`
				});
			});
		}
	},

	async beforeRouteEnter (to, from, next) {
		const
			sdk = Vue.prototype.sdk,
			offer = sdk.barteron.offers[to.params?.id],
			deals = await sdk.getBrtOfferDeals({
				myTags: [offer?.tag],
				theirTags: offer?.tags,
				excludeAddresses: [offer?.address]
			});

		/* Pass data to instance */
		next(vm => vm.deals = deals);
	}
}